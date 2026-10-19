import pandas as pd
import numpy as np


# ============================================================
# ATM SENTINEL - MODEL VALIDATION
# ============================================================

INPUT_FILE = "ml/output/anomaly_results.csv"


# ------------------------------------------------------------
# 1. LOAD MODEL RESULTS
# ------------------------------------------------------------
print("\n===== LOADING MODEL RESULTS =====")

df = pd.read_csv(INPUT_FILE)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")


# ------------------------------------------------------------
# 2. BASIC ANOMALY SUMMARY
# ------------------------------------------------------------
print("\n===== ANOMALY SUMMARY =====")

normal_count = (~df["is_anomaly"]).sum()
anomaly_count = df["is_anomaly"].sum()

print(f"Normal observations : {normal_count:,}")
print(f"Anomalous observations: {anomaly_count:,}")

print(
    f"Anomaly percentage  : "
    f"{anomaly_count / len(df) * 100:.2f}%"
)


# ------------------------------------------------------------
# 3. ANOMALY SCORE STATISTICS
# ------------------------------------------------------------
print("\n===== ANOMALY SCORE STATISTICS =====")

print(
    df["anomaly_score"].describe()
)


# ------------------------------------------------------------
# 4. RISK DISTRIBUTION
# ------------------------------------------------------------
print("\n===== RISK LEVEL DISTRIBUTION =====")

risk_order = [
    "Normal",
    "Low",
    "Medium",
    "High"
]

risk_counts = (
    df["risk_level"]
    .value_counts()
    .reindex(
        risk_order,
        fill_value=0
    )
)

for risk, count in risk_counts.items():

    percentage = (
        count / len(df)
    ) * 100

    print(
        f"{risk:8s}: "
        f"{count:6,} "
        f"({percentage:.2f}%)"
    )


# ------------------------------------------------------------
# 5. COMPARE NORMAL VS ANOMALOUS BEHAVIOR
# ------------------------------------------------------------
print("\n===== NORMAL VS ANOMALOUS BEHAVIOR =====")

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

comparison = (
    df.groupby("is_anomaly")[comparison_columns]
    .mean()
)

comparison.index = [
    "Normal" if value is False else "Anomalous"
    for value in comparison.index
]

print(
    comparison.to_string()
)


# ------------------------------------------------------------
# 6. TOP ANOMALOUS OBSERVATIONS
# ------------------------------------------------------------
print("\n===== TOP 20 MOST ANOMALOUS OBSERVATIONS =====")

top_anomalies = (
    df[df["is_anomaly"]]
    .sort_values(
        "anomaly_score",
        ascending=False
    )
    .head(20)
)

display_columns = [
    "atmId",
    "atmName",
    "transactionTime",
    "hour",
    "totalNumberTransaction",
    "totalBalance",
    "totalIncome",
    "totalOutcome",
    "volume_vs_hour_baseline",
    "anomaly_score",
    "risk_level",
]

print(
    top_anomalies[display_columns]
    .to_string(index=False)
)


# ------------------------------------------------------------
# 7. ANOMALIES BY HOUR
# ------------------------------------------------------------
print("\n===== ANOMALIES BY HOUR =====")

hour_summary = (
    df.groupby("hour")
    .agg(
        total_observations=(
            "hour",
            "size"
        ),
        anomalies=(
            "is_anomaly",
            "sum"
        ),
        average_transactions=(
            "totalNumberTransaction",
            "mean"
        )
    )
)

hour_summary["anomaly_rate"] = (
    hour_summary["anomalies"]
    / hour_summary["total_observations"]
    * 100
)

print(
    hour_summary.to_string()
)


# ------------------------------------------------------------
# 8. ANOMALIES BY ATM
# ------------------------------------------------------------
print("\n===== ATM ANOMALY SUMMARY =====")

atm_summary = (
    df.groupby(
        ["atmId", "atmName"]
    )
    .agg(
        observations=(
            "atmId",
            "size"
        ),
        anomalies=(
            "is_anomaly",
            "sum"
        ),
        average_score=(
            "anomaly_score",
            "mean"
        )
    )
)

atm_summary["anomaly_rate"] = (
    atm_summary["anomalies"]
    / atm_summary["observations"]
    * 100
)

top_atms = (
    atm_summary
    .sort_values(
        ["anomalies", "anomaly_rate"],
        ascending=False
    )
    .head(10)
)

print(
    top_atms.to_string()
)


# ------------------------------------------------------------
# 9. CHECK FOR MISSING VALUES
# ------------------------------------------------------------
print("\n===== DATA QUALITY CHECK =====")

missing_values = (
    df.isnull()
    .sum()
    .sum()
)

duplicate_rows = (
    df.duplicated()
    .sum()
)

print(
    f"Missing values : {missing_values}"
)

print(
    f"Duplicate rows : {duplicate_rows}"
)


# ------------------------------------------------------------
# 10. FINAL VALIDATION MESSAGE
# ------------------------------------------------------------
print("\n===== VALIDATION COMPLETE =====")

if missing_values == 0 and duplicate_rows == 0:

    print(
        "Data quality check passed."
    )

else:

    print(
        "WARNING: Data quality issues detected."
    )

print(
    "\nThe results represent behavioral anomalies "
    "identified by an unsupervised Isolation Forest model."
)

print(
    "They should NOT be interpreted as confirmed fraud "
    "because the dataset contains no confirmed fraud labels."
)

print("\nDone.")