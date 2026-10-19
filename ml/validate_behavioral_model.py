from pathlib import Path

import pandas as pd


# =========================================================
# ATM SENTINEL - BEHAVIORAL MODEL VALIDATION
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = PROJECT_ROOT / "ml" / "output" / "behavioral_if05_results.csv"


print("=" * 75)
print("ATM SENTINEL - BEHAVIORAL ISOLATION FOREST VALIDATION")
print("=" * 75)


# =========================================================
# LOAD RESULTS
# =========================================================

if not INPUT_FILE.exists():
    raise FileNotFoundError(
        f"Model results not found:\n{INPUT_FILE}\n"
        "Run compare_models.py first."
    )

df = pd.read_csv(INPUT_FILE)

print(f"\nDataset rows: {len(df):,}")
print(f"Dataset columns: {len(df.columns)}")


# =========================================================
# BASIC MODEL SUMMARY
# =========================================================

print("\n" + "=" * 75)
print("1. ANOMALY SUMMARY")
print("=" * 75)

anomaly_count = int(df["is_anomaly"].sum())
normal_count = len(df) - anomaly_count
anomaly_rate = anomaly_count / len(df) * 100

print(f"Normal transactions:    {normal_count:,}")
print(f"Flagged as anomalous:   {anomaly_count:,}")
print(f"Anomaly rate:            {anomaly_rate:.2f}%")


# =========================================================
# ANOMALY SCORE STATISTICS
# =========================================================

print("\n" + "=" * 75)
print("2. ANOMALY SCORE STATISTICS")
print("=" * 75)

print(
    df["anomaly_score"]
    .describe()
    .to_string()
)


# =========================================================
# NORMAL VS ANOMALOUS BEHAVIOR
# =========================================================

print("\n" + "=" * 75)
print("3. NORMAL VS ANOMALOUS BEHAVIOR")
print("=" * 75)

comparison_columns = [
    "totalNumberTransaction",
    "totalBalance",
    "totalIncome",
    "totalOutcome",
    "net_transaction_flow",
    "total_money_flow",
    "volume_vs_hour_baseline",
    "volume_hour_ratio",
]

summary = (
    df.groupby("is_anomaly")[comparison_columns]
    .mean()
    .round(2)
)

summary.index = [
    "Normal",
    "Anomalous",
]

print(summary.to_string())


# =========================================================
# ANOMALIES BY HOUR
# =========================================================

print("\n" + "=" * 75)
print("4. ANOMALIES BY HOUR")
print("=" * 75)

hour_summary = (
    df.groupby("hour")
    .agg(
        total_transactions=("is_anomaly", "size"),
        anomalous_transactions=("is_anomaly", "sum"),
        anomaly_rate=("is_anomaly", "mean"),
    )
)

hour_summary["anomaly_rate"] = (
    hour_summary["anomaly_rate"] * 100
).round(2)

print(
    hour_summary.to_string()
)


# =========================================================
# TOP ANOMALOUS HOURS
# =========================================================

print("\n" + "=" * 75)
print("5. HIGHEST ANOMALY-RATE HOURS")
print("=" * 75)

top_hours = (
    hour_summary
    .sort_values("anomaly_rate", ascending=False)
    .head(10)
)

print(top_hours.to_string())


# =========================================================
# ATM-LEVEL ANALYSIS
# =========================================================

print("\n" + "=" * 75)
print("6. ATM ANOMALY SUMMARY")
print("=" * 75)

atm_summary = (
    df.groupby(["atmId", "atmName"])
    .agg(
        observations=("is_anomaly", "size"),
        anomalies=("is_anomaly", "sum"),
        anomaly_rate=("is_anomaly", "mean"),
    )
)

atm_summary["anomaly_rate"] = (
    atm_summary["anomaly_rate"] * 100
).round(2)

top_atms = (
    atm_summary
    .sort_values(
        ["anomaly_rate", "anomalies"],
        ascending=False
    )
    .head(15)
)

print(top_atms.to_string())


# =========================================================
# TOP 20 MOST ANOMALOUS TRANSACTIONS
# =========================================================

print("\n" + "=" * 75)
print("7. TOP 20 MOST ANOMALOUS TRANSACTIONS")
print("=" * 75)

top_anomalies = (
    df[df["is_anomaly"]]
    .sort_values("anomaly_score", ascending=False)
    .head(20)
)

display_columns = [
    "atmId",
    "atmName",
    "atmCity",
    "transactionTime",
    "totalNumberTransaction",
    "totalBalance",
    "totalIncome",
    "totalOutcome",
    "volume_vs_hour_baseline",
    "volume_hour_ratio",
    "anomaly_score",
]

available_columns = [
    column
    for column in display_columns
    if column in top_anomalies.columns
]

print(
    top_anomalies[available_columns]
    .to_string(index=False)
)


# =========================================================
# HIGH ACTIVITY VS LOW ACTIVITY ANOMALIES
# =========================================================

print("\n" + "=" * 75)
print("8. ANOMALY ACTIVITY PATTERN")
print("=" * 75)

anomalies = df[df["is_anomaly"]].copy()

transaction_median = df["totalNumberTransaction"].median()

high_activity = (
    anomalies["totalNumberTransaction"] > transaction_median
).sum()

low_activity = (
    anomalies["totalNumberTransaction"] < transaction_median
).sum()

equal_activity = (
    anomalies["totalNumberTransaction"] == transaction_median
).sum()

print(
    f"Dataset transaction median: {transaction_median:.2f}"
)

print(
    f"Anomalies above median activity: "
    f"{high_activity:,}"
)

print(
    f"Anomalies below median activity: "
    f"{low_activity:,}"
)

print(
    f"Anomalies equal to median activity: "
    f"{equal_activity:,}"
)


# =========================================================
# DATA QUALITY CHECK
# =========================================================

print("\n" + "=" * 75)
print("9. DATA QUALITY CHECK")
print("=" * 75)

missing_values = int(df.isna().sum().sum())
duplicate_rows = int(df.duplicated().sum())

print(f"Missing values: {missing_values}")
print(f"Duplicate rows: {duplicate_rows}")


# =========================================================
# FINAL INTERPRETATION
# =========================================================

print("\n" + "=" * 75)
print("10. VALIDATION CONCLUSION")
print("=" * 75)

print(
    "The Behavioral Isolation Forest identifies transactions that "
    "deviate from learned transaction behavior. These records are "
    "flagged as anomalous and should be investigated further; they "
    "should not automatically be interpreted as confirmed fraud."
)

print("\nValidation complete.")