#!/usr/bin/env python3
"""Train an unsupervised model on the synthetic Malawi transactions.

Run from the project root:
    python ml/generate_malawi_model_results.py

The raw dataset and legacy results are read-only. Predictions are written to a
separate frontend asset, while the injected ground-truth columns are preserved
for demonstration-only analysis and never included in the model features.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
INPUT_PATH = PROJECT_ROOT / "dataset" / "atm_transactions_malawi_synthetic.csv"
OUTPUT_PATH = (
    PROJECT_ROOT / "frontend" / "public" / "data" / "malawi_anomaly_results.csv"
)
SEED = 20261012
REQUIRED_MODEL_FIELDS = {
    "transaction_amount_mwk",
    "balance_after_mwk",
    "transaction_datetime",
    "is_weekend",
    "transaction_type",
    "transaction_status",
}


def make_model_features(records: pd.DataFrame) -> pd.DataFrame:
    """Build behavioral features without identifiers or injected labels."""
    timestamps = pd.to_datetime(records["transaction_datetime"], errors="raise")
    day_of_week = timestamps.dt.dayofweek
    hour = timestamps.dt.hour

    features = pd.DataFrame(
        {
            "log_transaction_amount_mwk": np.log1p(
                pd.to_numeric(records["transaction_amount_mwk"], errors="raise")
            ),
            "log_balance_after_mwk": np.log1p(
                pd.to_numeric(records["balance_after_mwk"], errors="raise")
            ),
            "hour_sin": np.sin(2 * np.pi * hour / 24),
            "hour_cos": np.cos(2 * np.pi * hour / 24),
            "weekday_sin": np.sin(2 * np.pi * day_of_week / 7),
            "weekday_cos": np.cos(2 * np.pi * day_of_week / 7),
            "is_weekend": pd.to_numeric(records["is_weekend"], errors="raise"),
        },
        index=records.index,
    )
    categories = pd.concat(
        [
            pd.get_dummies(
                records["transaction_type"].astype(str), prefix="type", dtype=float
            ),
            pd.get_dummies(
                records["transaction_status"].astype(str), prefix="status", dtype=float
            ),
        ],
        axis=1,
    )
    features = pd.concat([features, categories], axis=1).astype(float)
    if features.empty or not np.isfinite(features.to_numpy()).all():
        raise ValueError("Model features are empty or contain non-finite values.")
    return features


def assign_risk_levels(scores: pd.Series) -> pd.Series:
    low = scores.quantile(0.90)
    medium = scores.quantile(0.95)
    high = scores.quantile(0.99)
    return pd.Series(
        np.select(
            [scores >= high, scores >= medium, scores >= low],
            ["High", "Medium", "Low"],
            default="Normal",
        ),
        index=scores.index,
    )


def score_transactions(records: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Score eligible rows and report how many rows were excluded."""
    missing_fields = sorted(REQUIRED_MODEL_FIELDS.difference(records.columns))
    if missing_fields:
        raise ValueError(f"Input dataset is missing model fields: {', '.join(missing_fields)}")

    amounts = pd.to_numeric(records["transaction_amount_mwk"], errors="coerce")
    balances = pd.to_numeric(records["balance_after_mwk"], errors="coerce")
    timestamps = pd.to_datetime(records["transaction_datetime"], errors="coerce")
    weekend = pd.to_numeric(records["is_weekend"], errors="coerce")
    transaction_types = records["transaction_type"].astype("string").str.strip()
    statuses = records["transaction_status"].astype("string").str.strip()
    eligible = (
        amounts.notna()
        & np.isfinite(amounts)
        & amounts.ge(0)
        & balances.notna()
        & np.isfinite(balances)
        & balances.ge(0)
        & timestamps.notna()
        & weekend.isin([0, 1])
        & transaction_types.notna()
        & transaction_types.ne("")
        & statuses.notna()
        & statuses.ne("")
    )
    eligible_records = records.loc[eligible].copy()
    if len(eligible_records) < 2:
        raise ValueError("At least two eligible transactions are required to train Isolation Forest.")

    features = make_model_features(eligible_records)
    forbidden_feature_fields = {
        "transaction_id",
        "account_id",
        "is_anomaly",
        "ground_truth_anomaly",
        "anomaly_type",
    }
    if forbidden_feature_fields.intersection(features.columns):
        raise ValueError("An identifier or injected label entered the model features.")

    model = IsolationForest(
        n_estimators=300,
        contamination=0.05,
        random_state=SEED,
        n_jobs=-1,
    )
    predictions = model.fit_predict(features)
    scores = -model.decision_function(features)
    if not np.isfinite(scores).all():
        raise ValueError("The model produced non-finite anomaly scores.")

    results = eligible_records.copy()
    results["model_prediction"] = predictions
    results["model_anomaly_score"] = scores
    results["model_is_anomaly"] = predictions == -1
    results["model_risk_level"] = assign_risk_levels(pd.Series(scores, index=results.index))
    return results, len(records) - len(eligible_records)


def main() -> None:
    if not INPUT_PATH.is_file():
        raise FileNotFoundError(
            f"Synthetic Malawi input dataset not found: {INPUT_PATH}\n"
            "Run python ml/generate_malawi_dataset.py first."
        )

    records = pd.read_csv(INPUT_PATH)
    results, excluded_count = score_transactions(records)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    results.to_csv(OUTPUT_PATH, index=False, float_format="%.8f")

    print(f"Input: {INPUT_PATH}")
    print(f"Results: {OUTPUT_PATH}")
    print(f"Rows scored: {len(results):,}")
    print(f"Rows excluded for invalid model features: {excluded_count:,}")
    print(f"Behavioral model features: {len(make_model_features(results).columns)}")
    print(f"Model-flagged transactions: {int(results['model_is_anomaly'].sum()):,}")
    print(
        "Ground-truth anomaly labels preserved separately: "
        f"{int(results['ground_truth_anomaly'].sum()):,}"
    )
    print("No model evaluation metrics were calculated.")


if __name__ == "__main__":
    main()
