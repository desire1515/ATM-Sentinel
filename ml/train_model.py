import os
import pandas as pd
from sklearn.ensemble import IsolationForest


# ============================================================
# ATM SENTINEL - ISOLATION FOREST ANOMALY DETECTION
# FINAL 13-FEATURE MODEL
# ============================================================


# ------------------------------------------------------------
# 1. FILE PATHS
# ------------------------------------------------------------
INPUT_FILE = "ml/output/engineered_features.csv"

OUTPUT_DIR = "ml/output"

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "anomaly_results.csv"
)


# ------------------------------------------------------------
# 2. LOAD ENGINEERED DATA
# ------------------------------------------------------------
print("\n===== LOADING ENGINEERED DATA =====")

df = pd.read_csv(INPUT_FILE)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")


# ------------------------------------------------------------
# 3. DEFINE FINAL MODEL FEATURES
# ------------------------------------------------------------
print("\n===== DEFINING MODEL FEATURES =====")

model_features = [
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


print("Final feature set:")
for number, feature in enumerate(model_features, start=1):
    print(f"  {number:2d}. {feature}")

print(f"\nFeatures used by model: {len(model_features)}")


# ------------------------------------------------------------
# 4. PREPARE ML INPUT
# ------------------------------------------------------------
print("\n===== PREPARING MODEL INPUT =====")

X = df[model_features].copy()

print(
    f"Training observations: {len(X):,}"
)

print(
    f"Training features    : {X.shape[1]}"
)


# ------------------------------------------------------------
# 5. CHECK ML INPUT
# ------------------------------------------------------------
print("\n===== CHECKING MODEL INPUT =====")

missing_values = X.isnull().sum().sum()

infinite_values = (
    X.replace(
        [float("inf"), float("-inf")],
        pd.NA
    )
    .isnull()
    .sum()
    .sum()
)

print(
    f"Missing values  : {missing_values}"
)

print(
    f"Invalid values  : {infinite_values}"
)


if missing_values > 0 or infinite_values > 0:

    raise ValueError(
        "Model input contains missing or invalid values."
    )

print("Model input check passed.")


# ------------------------------------------------------------
# 6. CREATE ISOLATION FOREST
# ------------------------------------------------------------
print("\n===== CREATING ISOLATION FOREST =====")

model = IsolationForest(
    n_estimators=300,
    contamination=0.05,
    random_state=42,
    n_jobs=-1
)


print("Isolation Forest configuration:")
print("  Trees         : 300")
print("  Contamination : 0.05")
print("  Random state  : 42")
print("  Parallel jobs : -1")


# ------------------------------------------------------------
# 7. TRAIN MODEL
# ------------------------------------------------------------
print("\n===== TRAINING MODEL =====")

model.fit(X)

print(
    "Model training completed successfully."
)


# ------------------------------------------------------------
# 8. GENERATE PREDICTIONS
# ------------------------------------------------------------
print("\n===== GENERATING ANOMALY PREDICTIONS =====")

# Isolation Forest returns:
#
#   1  = normal
#  -1  = anomaly
#
predictions = model.predict(X)


# decision_function:
#
# higher value = more normal
# lower value  = more anomalous
#
# Therefore we multiply by -1 so that:
#
# higher anomaly_score = more anomalous

decision_scores = model.decision_function(X)

anomaly_scores = -decision_scores


# ------------------------------------------------------------
# 9. ADD RESULTS TO DATASET
# ------------------------------------------------------------
df["anomaly_prediction"] = predictions

df["anomaly_score"] = anomaly_scores


# ------------------------------------------------------------
# 10. IDENTIFY ANOMALIES
# ------------------------------------------------------------
df["is_anomaly"] = (
    df["anomaly_prediction"] == -1
)


# ------------------------------------------------------------
# 11. CALCULATE RISK LEVELS
# ------------------------------------------------------------
print("\n===== CALCULATING RISK LEVELS =====")

# Risk levels are based on the distribution of
# anomaly scores, not confirmed fraud labels.

low_threshold = (
    df["anomaly_score"].quantile(0.90)
)

medium_threshold = (
    df["anomaly_score"].quantile(0.95)
)

high_threshold = (
    df["anomaly_score"].quantile(0.99)
)


def assign_risk(score):

    if score >= high_threshold:
        return "High"

    if score >= medium_threshold:
        return "Medium"

    if score >= low_threshold:
        return "Low"

    return "Normal"


df["risk_level"] = (
    df["anomaly_score"]
    .apply(assign_risk)
)


print(
    f"Low threshold    : {low_threshold:.6f}"
)

print(
    f"Medium threshold : {medium_threshold:.6f}"
)

print(
    f"High threshold   : {high_threshold:.6f}"
)


# ------------------------------------------------------------
# 12. SAVE RESULTS
# ------------------------------------------------------------
print("\n===== SAVING ANOMALY RESULTS =====")

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print(
    f"Results saved to: {OUTPUT_FILE}"
)


# ------------------------------------------------------------
# 13. DISPLAY MODEL SUMMARY
# ------------------------------------------------------------
total_records = len(df)

anomaly_count = int(
    df["is_anomaly"].sum()
)

normal_count = (
    total_records - anomaly_count
)

anomaly_percentage = (
    anomaly_count / total_records
) * 100


print("\n===== FINAL MODEL SUMMARY =====")

print(
    f"Total observations : {total_records:,}"
)

print(
    f"Normal observations: {normal_count:,}"
)

print(
    f"Anomalies flagged  : {anomaly_count:,}"
)

print(
    f"Anomaly percentage : {anomaly_percentage:.2f}%"
)


# ------------------------------------------------------------
# 14. RISK DISTRIBUTION
# ------------------------------------------------------------
print("\n===== RISK DISTRIBUTION =====")

risk_counts = (
    df["risk_level"]
    .value_counts()
    .reindex(
        [
            "Normal",
            "Low",
            "Medium",
            "High"
        ],
        fill_value=0
    )
)


for risk, count in risk_counts.items():

    percentage = (
        count / total_records
    ) * 100

    print(
        f"{risk:8s}: "
        f"{count:6,} "
        f"({percentage:.2f}%)"
    )


# ------------------------------------------------------------
# 15. TOP ANOMALOUS OBSERVATIONS
# ------------------------------------------------------------
print(
    "\n===== TOP 10 MOST ANOMALOUS OBSERVATIONS ====="
)


top_anomalies = (
    df[df["is_anomaly"]]
    .sort_values(
        "anomaly_score",
        ascending=False
    )
    .head(10)
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
    "volume_hour_ratio",
    "anomaly_score",
    "risk_level",
]


print(
    top_anomalies[
        display_columns
    ].to_string(index=False)
)


# ------------------------------------------------------------
# 16. FINAL MESSAGE
# ------------------------------------------------------------
print(
    "\n===== MODEL TRAINING COMPLETE ====="
)

print(
    "\nImportant:"
)

print(
    "These results represent behavioral anomalies "
    "identified by an unsupervised Isolation Forest model."
)

print(
    "They are NOT confirmed fraud because the dataset "
    "contains no confirmed fraud labels."
)

print(
    "\nThe 5% contamination value represents the model's "
    "anomaly-detection assumption, not a fraud rate."
)

print("\nDone.")