from pathlib import Path

import pandas as pd


# =========================================================
# ATM SENTINEL - FEATURE DIAGNOSTIC
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    PROJECT_ROOT
    / "ml"
    / "output"
    / "behavioral_if05_time_neutral_test.csv"
)


print("=" * 75)
print("ATM SENTINEL - FEATURE DIAGNOSTIC")
print("=" * 75)


# =========================================================
# LOAD RESULTS
# =========================================================

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"File not found:\n{INPUT_FILE}\n\n"
        "Run compare_models.py first."
    )

df = pd.read_csv(INPUT_FILE)

print(f"\nRows loaded: {len(df):,}")


# =========================================================
# FEATURES USED BY BEHAVIORAL_IF05
# =========================================================

FEATURES = [
    "totalBalance",
    "income_transaction_share",
    "outcome_transaction_share",
    "average_income_per_transaction",
    "average_outcome_per_transaction",
    "income_outcome_ratio",
    "net_flow_ratio",
    "totalNumberTransaction_atm_deviation",
    "totalBalance_atm_deviation",
    "totalIncome_atm_deviation",
    "totalOutcome_atm_deviation",
    "volume_vs_hour_baseline",
    "volume_hour_ratio",
    "hour_sin",
    "hour_cos",
]


# =========================================================
# CHECK FEATURES
# =========================================================

missing = [
    feature
    for feature in FEATURES
    if feature not in df.columns
]

if missing:
    raise ValueError(
        f"Missing features:\n{missing}"
    )


# =========================================================
# SPLIT NORMAL / ANOMALOUS
# =========================================================

normal = df[df["is_anomaly"] == False]
anomalous = df[df["is_anomaly"] == True]


print("\n" + "=" * 75)
print("DATASET SUMMARY")
print("=" * 75)

print(f"Normal observations:    {len(normal):,}")
print(f"Anomalous observations: {len(anomalous):,}")


# =========================================================
# FEATURE COMPARISON
# =========================================================

rows = []

for feature in FEATURES:

    normal_mean = normal[feature].mean()
    anomaly_mean = anomalous[feature].mean()

    normal_median = normal[feature].median()
    anomaly_median = anomalous[feature].median()

    difference = anomaly_mean - normal_mean

    if normal_mean != 0:
        percentage_difference = (
            difference / abs(normal_mean)
        ) * 100
    else:
        percentage_difference = 0

    rows.append(
        {
            "feature": feature,
            "normal_mean": normal_mean,
            "anomaly_mean": anomaly_mean,
            "normal_median": normal_median,
            "anomaly_median": anomaly_median,
            "difference": difference,
            "percentage_difference": percentage_difference,
        }
    )


comparison = pd.DataFrame(rows)

comparison["absolute_difference"] = (
    comparison["percentage_difference"].abs()
)

comparison = comparison.sort_values(
    "absolute_difference",
    ascending=False,
)


# =========================================================
# DISPLAY
# =========================================================

print("\n" + "=" * 75)
print("FEATURE DIFFERENCES")
print("=" * 75)

for _, row in comparison.iterrows():

    print(
        f"\n{row['feature']}"
    )

    print(
        f"  Normal mean:       "
        f"{row['normal_mean']:.6f}"
    )

    print(
        f"  Anomaly mean:      "
        f"{row['anomaly_mean']:.6f}"
    )

    print(
        f"  Normal median:     "
        f"{row['normal_median']:.6f}"
    )

    print(
        f"  Anomaly median:    "
        f"{row['anomaly_median']:.6f}"
    )

    print(
        f"  Percentage change: "
        f"{row['percentage_difference']:.2f}%"
    )


# =========================================================
# TRANSACTION ACTIVITY ANALYSIS
# =========================================================

print("\n" + "=" * 75)
print("TRANSACTION ACTIVITY")
print("=" * 75)

median_transactions = df[
    "totalNumberTransaction"
].median()

below_median = anomalous[
    anomalous["totalNumberTransaction"]
    < median_transactions
]

above_median = anomalous[
    anomalous["totalNumberTransaction"]
    > median_transactions
]

equal_median = anomalous[
    anomalous["totalNumberTransaction"]
    == median_transactions
]

print(
    f"\nDataset transaction median: "
    f"{median_transactions:.2f}"
)

print(
    f"Anomalies below median:    "
    f"{len(below_median):,}"
)

print(
    f"Anomalies above median:    "
    f"{len(above_median):,}"
)

print(
    f"Anomalies equal to median: "
    f"{len(equal_median):,}"
)


# =========================================================
# TIME DISTRIBUTION
# =========================================================

print("\n" + "=" * 75)
print("ANOMALIES BY HOUR")
print("=" * 75)

hourly = (
    df.groupby("hour")["is_anomaly"]
    .agg(["count", "sum"])
)

hourly["anomaly_rate_percent"] = (
    hourly["sum"]
    / hourly["count"]
    * 100
)

for hour, row in hourly.iterrows():

    print(
        f"{int(hour):02d}:00  "
        f"total={int(row['count']):4d}  "
        f"anomalies={int(row['sum']):4d}  "
        f"rate={row['anomaly_rate_percent']:6.2f}%"
    )


# =========================================================
# SAVE DIAGNOSTIC REPORT
# =========================================================

OUTPUT_FILE = (
    PROJECT_ROOT
    / "ml"
    / "output"
    / "feature_diagnostic.csv"
)

comparison.drop(
    columns=["absolute_difference"]
).to_csv(
    OUTPUT_FILE,
    index=False,
)


print("\n" + "=" * 75)
print("DIAGNOSTIC COMPLETE")
print("=" * 75)

print(
    f"\nDiagnostic report saved to:\n"
    f"{OUTPUT_FILE}"
)