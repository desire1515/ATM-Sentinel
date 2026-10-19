from pathlib import Path

import pandas as pd
from sklearn.ensemble import IsolationForest


# =========================================================
# ATM SENTINEL - 9-FEATURE MODEL EXPERIMENT
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    PROJECT_ROOT
    / "ml"
    / "output"
    / "engineered_features.csv"
)

OUTPUT_DIR = (
    PROJECT_ROOT
    / "ml"
    / "output"
)


print("=" * 75)
print("ATM SENTINEL - 9-FEATURE MODEL EXPERIMENT")
print("=" * 75)


# =========================================================
# LOAD ENGINEERED DATA
# =========================================================

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"Engineered dataset not found:\n{INPUT_FILE}\n\n"
        "Run feature_engineering.py first."
    )

df = pd.read_csv(INPUT_FILE)

print(f"\nDataset loaded: {len(df):,} rows")


# =========================================================
# FEATURE SETS
# =========================================================

# Current 13-feature model.
# This is our baseline for this experiment.
BASELINE_13_FEATURES = [
    "totalBalance",
    "income_transaction_share",
    "outcome_transaction_share",
    "average_income_per_transaction",
    "average_outcome_per_transaction",
    "net_flow_ratio",
    "totalBalance_atm_deviation",
    "totalIncome_atm_deviation",
    "totalOutcome_atm_deviation",
    "volume_vs_hour_baseline",
    "volume_hour_ratio",
    "hour_sin",
    "hour_cos",
]


# New 9-feature model.
#
# The four time-related features are removed:
#
# volume_vs_hour_baseline
# volume_hour_ratio
# hour_sin
# hour_cos
#
# This allows us to test whether the anomaly detector
# is relying too heavily on time/activity patterns.
MODEL_9_FEATURES = [
    "totalBalance",
    "income_transaction_share",
    "outcome_transaction_share",
    "average_income_per_transaction",
    "average_outcome_per_transaction",
    "net_flow_ratio",
    "totalBalance_atm_deviation",
    "totalIncome_atm_deviation",
    "totalOutcome_atm_deviation",
]


# =========================================================
# EXPERIMENTS
# =========================================================

EXPERIMENTS = [
    {
        "name": "Baseline_13Feature_IF05",
        "features": BASELINE_13_FEATURES,
        "contamination": 0.05,
    },
    {
        "name": "Model_9Feature_IF05",
        "features": MODEL_9_FEATURES,
        "contamination": 0.05,
    },
]


# =========================================================
# CHECK FEATURES
# =========================================================

for experiment in EXPERIMENTS:

    missing = [
        feature
        for feature in experiment["features"]
        if feature not in df.columns
    ]

    if missing:
        raise ValueError(
            f"Missing features for "
            f"{experiment['name']}:\n{missing}"
        )


# =========================================================
# RUN EXPERIMENTS
# =========================================================

comparison_results = []


for experiment in EXPERIMENTS:

    name = experiment["name"]
    features = experiment["features"]
    contamination = experiment["contamination"]

    print("\n" + "-" * 75)
    print(f"Running: {name}")
    print(f"Features: {len(features)}")
    print(f"Contamination: {contamination}")
    print("-" * 75)

    X = df[features].copy()

    # -----------------------------------------------------
    # Isolation Forest
    # -----------------------------------------------------

    model = IsolationForest(
        n_estimators=300,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )

    predictions = model.fit_predict(X)

    decision_scores = model.decision_function(X)

    # Higher anomaly score = more anomalous.
    anomaly_scores = -decision_scores

    result = df.copy()

    result["anomaly_score"] = anomaly_scores
    result["is_anomaly"] = predictions == -1

    # -----------------------------------------------------
    # Basic anomaly statistics
    # -----------------------------------------------------

    anomaly_count = int(
        result["is_anomaly"].sum()
    )

    anomaly_rate = (
        anomaly_count
        / len(result)
        * 100
    )

    # -----------------------------------------------------
    # Hour analysis
    # -----------------------------------------------------

    hourly_rates = (
        result.groupby("hour")["is_anomaly"]
        .mean()
        .mul(100)
    )

    highest_hour = hourly_rates.idxmax()
    highest_hour_rate = hourly_rates.max()

    lowest_hour = hourly_rates.idxmin()
    lowest_hour_rate = hourly_rates.min()

    hours_with_anomalies = int(
        (hourly_rates > 0).sum()
    )

    # -----------------------------------------------------
    # ATM analysis
    # -----------------------------------------------------

    atm_rates = (
        result.groupby("atmId")["is_anomaly"]
        .mean()
        .mul(100)
    )

    highest_atm = atm_rates.idxmax()
    highest_atm_rate = atm_rates.max()

    # -----------------------------------------------------
    # Transaction activity analysis
    # -----------------------------------------------------

    median_transactions = (
        df["totalNumberTransaction"]
        .median()
    )

    anomalies = result[
        result["is_anomaly"]
    ]

    low_activity_count = int(
        (
            anomalies["totalNumberTransaction"]
            < median_transactions
        ).sum()
    )

    high_activity_count = int(
        (
            anomalies["totalNumberTransaction"]
            > median_transactions
        ).sum()
    )

    equal_activity_count = int(
        (
            anomalies["totalNumberTransaction"]
            == median_transactions
        ).sum()
    )

    # -----------------------------------------------------
    # Average transaction activity
    # -----------------------------------------------------

    normal_mean_transactions = result[
        ~result["is_anomaly"]
    ]["totalNumberTransaction"].mean()

    anomaly_mean_transactions = anomalies[
        "totalNumberTransaction"
    ].mean()

    # -----------------------------------------------------
    # Anomaly score statistics
    # -----------------------------------------------------

    mean_score = result[
        "anomaly_score"
    ].mean()

    median_score = result[
        "anomaly_score"
    ].median()

    # -----------------------------------------------------
    # Save experiment result
    # -----------------------------------------------------

    output_file = (
        OUTPUT_DIR
        / f"{name.lower()}.csv"
    )

    result.to_csv(
        output_file,
        index=False
    )

    # -----------------------------------------------------
    # Store comparison results
    # -----------------------------------------------------

    comparison_results.append(
        {
            "model": name,
            "feature_count": len(features),
            "contamination": contamination,
            "anomalies": anomaly_count,
            "anomaly_rate_percent": round(
                anomaly_rate,
                2
            ),
            "highest_hour": int(
                highest_hour
            ),
            "highest_hour_rate_percent": round(
                highest_hour_rate,
                2
            ),
            "lowest_hour": int(
                lowest_hour
            ),
            "lowest_hour_rate_percent": round(
                lowest_hour_rate,
                2
            ),
            "hours_with_anomalies": (
                hours_with_anomalies
            ),
            "highest_atm": highest_atm,
            "highest_atm_rate_percent": round(
                highest_atm_rate,
                2
            ),
            "low_activity_anomalies": (
                low_activity_count
            ),
            "high_activity_anomalies": (
                high_activity_count
            ),
            "equal_activity_anomalies": (
                equal_activity_count
            ),
            "normal_mean_transactions": round(
                normal_mean_transactions,
                2
            ),
            "anomaly_mean_transactions": round(
                anomaly_mean_transactions,
                2
            ),
            "mean_anomaly_score": round(
                mean_score,
                6
            ),
            "median_anomaly_score": round(
                median_score,
                6
            ),
        }
    )

    # -----------------------------------------------------
    # Print results
    # -----------------------------------------------------

    print(
        f"Anomalies detected: "
        f"{anomaly_count:,}"
    )

    print(
        f"Anomaly rate: "
        f"{anomaly_rate:.2f}%"
    )

    print(
        f"Highest anomaly hour: "
        f"{int(highest_hour):02d}:00 "
        f"({highest_hour_rate:.2f}%)"
    )

    print(
        f"Lowest anomaly hour: "
        f"{int(lowest_hour):02d}:00 "
        f"({lowest_hour_rate:.2f}%)"
    )

    print(
        f"Hours containing anomalies: "
        f"{hours_with_anomalies}/24"
    )

    print(
        f"Highest anomaly ATM: "
        f"{highest_atm} "
        f"({highest_atm_rate:.2f}%)"
    )

    print(
        f"Low-activity anomalies: "
        f"{low_activity_count:,}"
    )

    print(
        f"High-activity anomalies: "
        f"{high_activity_count:,}"
    )

    print(
        f"Equal-to-median anomalies: "
        f"{equal_activity_count:,}"
    )

    print(
        f"Normal mean transactions: "
        f"{normal_mean_transactions:.2f}"
    )

    print(
        f"Anomaly mean transactions: "
        f"{anomaly_mean_transactions:.2f}"
    )

    print(
        f"Mean anomaly score: "
        f"{mean_score:.6f}"
    )

    print(
        f"Median anomaly score: "
        f"{median_score:.6f}"
    )

    print(
        f"Saved: {output_file}"
    )


# =========================================================
# COMPARISON TABLE
# =========================================================

comparison = pd.DataFrame(
    comparison_results
)

comparison_file = (
    OUTPUT_DIR
    / "9_feature_model_comparison.csv"
)

comparison.to_csv(
    comparison_file,
    index=False
)


print("\n" + "=" * 75)
print("9-FEATURE MODEL COMPARISON")
print("=" * 75)

print(
    comparison.to_string(
        index=False
    )
)

print("\n" + "=" * 75)
print("EXPERIMENT COMPLETE")
print("=" * 75)

print("\nComparison saved to:")
print(comparison_file)