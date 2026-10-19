import os
import numpy as np
import pandas as pd


# ============================================================
# ATM SENTINEL - FEATURE ENGINEERING
# ============================================================

# Project paths
INPUT_FILE = "dataset/atm_transactions.csv"
OUTPUT_DIR = "ml/output"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "engineered_features.csv"
)


# ------------------------------------------------------------
# 1. LOAD DATASET
# ------------------------------------------------------------
print("\n===== LOADING DATASET =====")

df = pd.read_csv(INPUT_FILE)

print(f"Rows loaded: {len(df):,}")
print(f"Columns loaded: {len(df.columns)}")


# ------------------------------------------------------------
# 2. CONVERT DATE/TIME
# ------------------------------------------------------------
print("\n===== CONVERTING DATE/TIME =====")

df["transactionTime"] = pd.to_datetime(
    df["transactionTime"],
    errors="coerce"
)

invalid_dates = df["transactionTime"].isna().sum()

if invalid_dates > 0:
    print(
        f"WARNING: {invalid_dates} invalid timestamps found."
    )
else:
    print("All timestamps converted successfully.")


# ------------------------------------------------------------
# 3. TIME-BASED FEATURES
# ------------------------------------------------------------
print("\n===== CREATING TIME FEATURES =====")

df["hour"] = df["transactionTime"].dt.hour

df["day_of_week"] = (
    df["transactionTime"].dt.dayofweek
)

# These are retained for analysis and reporting.
# They are NOT used as Isolation Forest model features.
df["hour_sin"] = np.sin(
    2 * np.pi * df["hour"] / 24
)

df["hour_cos"] = np.cos(
    2 * np.pi * df["hour"] / 24
)


# ------------------------------------------------------------
# 4. TRANSACTION BEHAVIOR FEATURES
# ------------------------------------------------------------
print("\n===== CREATING TRANSACTION FEATURES =====")

# Difference between income and outcome
df["net_transaction_flow"] = (
    df["totalIncome"] - df["totalOutcome"]
)

# Total money moving through the ATM
df["total_money_flow"] = (
    df["totalIncome"] + df["totalOutcome"]
)

# Proportion of transactions that are income
df["income_transaction_share"] = (
    df["numberIncomeTransaction"]
    / (df["totalNumberTransaction"] + 1)
)

# Proportion of transactions that are outcome
df["outcome_transaction_share"] = (
    df["numberOutcomeTransaction"]
    / (df["totalNumberTransaction"] + 1)
)

# Average amount associated with an income transaction
df["average_income_per_transaction"] = (
    df["totalIncome"]
    / (df["numberIncomeTransaction"] + 1)
)

# Average amount associated with an outcome transaction
df["average_outcome_per_transaction"] = (
    df["totalOutcome"]
    / (df["numberOutcomeTransaction"] + 1)
)

# ------------------------------------------------------------
# IMPORTANT:
# Keep this feature for analysis/reporting, but do not use it
# as an Isolation Forest model feature because the diagnostic
# showed extreme values.
# ------------------------------------------------------------
df["income_outcome_ratio"] = (
    (df["totalIncome"] + 1)
    / (df["totalOutcome"] + 1)
)

# Relative net cash flow
df["net_flow_ratio"] = (
    df["net_transaction_flow"]
    / (df["total_money_flow"] + 1)
)


# ------------------------------------------------------------
# 5. DATA CONSISTENCY FEATURE
# ------------------------------------------------------------
print("\n===== CHECKING TRANSACTION COUNTS =====")

df["transaction_count_difference"] = (
    df["totalNumberTransaction"]
    - (
        df["numberIncomeTransaction"]
        + df["numberOutcomeTransaction"]
    )
)

difference_count = (
    df["transaction_count_difference"] != 0
).sum()

print(
    "Rows where total transaction count differs "
    f"from income + outcome: {difference_count:,}"
)


# ------------------------------------------------------------
# 6. ATM-SPECIFIC BEHAVIORAL BASELINES
# ------------------------------------------------------------
print("\n===== CREATING ATM BEHAVIORAL BASELINES =====")

behavior_columns = [
    "totalNumberTransaction",
    "totalBalance",
    "totalIncome",
    "totalOutcome",
]


def robust_z_score(series):
    """
    Calculate a robust z-score using median and MAD.

    MAD = Median Absolute Deviation

    This is less affected by extreme values than
    the traditional mean/std z-score.
    """

    median = series.median()

    mad = np.median(
        np.abs(series - median)
    )

    scale = 1.4826 * mad

    # Prevent division by zero.
    if scale == 0:
        std = series.std()

        if pd.isna(std) or std == 0:
            scale = 1.0
        else:
            scale = std

    return (series - median) / scale


# Create behavioral deviation features for every ATM.
for column in behavior_columns:

    new_column = (
        f"{column}_atm_deviation"
    )

    df[new_column] = (
        df.groupby("atmId")[column]
        .transform(robust_z_score)
    )


# ------------------------------------------------------------
# 7. HOURLY TRANSACTION BASELINE
# ------------------------------------------------------------
print("\n===== CREATING HOURLY ACTIVITY BASELINE =====")

# These features are retained for analysis/reporting.
# They are NOT used by the final model feature set below.

hourly_median = (
    df.groupby("hour")[
        "totalNumberTransaction"
    ]
    .median()
    .rename("hourly_median_transactions")
)

df = df.join(
    hourly_median,
    on="hour"
)

df["volume_vs_hour_baseline"] = (
    df["totalNumberTransaction"]
    - df["hourly_median_transactions"]
)

df["volume_hour_ratio"] = (
    df["totalNumberTransaction"]
    / (
        df["hourly_median_transactions"] + 1
    )
)


# ------------------------------------------------------------
# 8. CLEAN NUMERIC VALUES
# ------------------------------------------------------------
print("\n===== CLEANING FEATURES =====")

# Replace infinite values created by divisions.
df.replace(
    [np.inf, -np.inf],
    np.nan,
    inplace=True
)

# Fill numeric missing values with zero.
numeric_columns = df.select_dtypes(
    include=[np.number]
).columns

df[numeric_columns] = (
    df[numeric_columns]
    .fillna(0)
)


# ------------------------------------------------------------
# 9. SELECT MODEL FEATURES
# ------------------------------------------------------------
print("\n===== SELECTING MODEL FEATURES =====")

# IMPORTANT:
# These are the features intended for the next
# Isolation Forest experiment.
#
# We deliberately exclude:
# - income_outcome_ratio
# - hour
# - hour_sin
# - hour_cos
# - volume_vs_hour_baseline
# - volume_hour_ratio
#
# We also exclude the raw transaction-count and
# raw income/outcome amount fields because their
# information is represented through behavioral ratios
# and ATM-specific deviations.

model_features = [

    # Core behavioral features
    "totalBalance",
    "income_transaction_share",
    "outcome_transaction_share",
    "average_income_per_transaction",
    "average_outcome_per_transaction",
    "net_flow_ratio",

    # ATM-specific behavioral deviations
    "totalNumberTransaction_atm_deviation",
    "totalBalance_atm_deviation",
    "totalIncome_atm_deviation",
    "totalOutcome_atm_deviation",
]


# Check that all expected features exist.
missing_features = [
    feature
    for feature in model_features
    if feature not in df.columns
]

if missing_features:
    raise ValueError(
        f"Missing model features: {missing_features}"
    )


# ------------------------------------------------------------
# 10. CREATE OUTPUT DATASET
# ------------------------------------------------------------
print("\n===== SAVING ENGINEERED DATASET =====")

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

# Keep useful identifying, raw, and analysis information
# for the dashboard/reporting.
#
# model_features determines which columns are intended
# for machine-learning experiments.

output_columns = [
    "atmId",
    "atmName",
    "atmCity",
    "atmAddress",
    "transactionTime",
    "day",
    "day_of_week",

    # Original transaction information
    "totalBalance",
    "numberIncomeTransaction",
    "numberOutcomeTransaction",
    "totalIncome",
    "totalOutcome",
    "totalNumberTransaction",

    # Time information for analysis
    "hour",
    "hour_sin",
    "hour_cos",

    # Behavioral information
    "net_transaction_flow",
    "total_money_flow",
    "income_transaction_share",
    "outcome_transaction_share",
    "average_income_per_transaction",
    "average_outcome_per_transaction",
    "income_outcome_ratio",
    "net_flow_ratio",

    # ATM-specific deviations
    "totalNumberTransaction_atm_deviation",
    "totalBalance_atm_deviation",
    "totalIncome_atm_deviation",
    "totalOutcome_atm_deviation",

    # Hourly analysis features
    "hourly_median_transactions",
    "volume_vs_hour_baseline",
    "volume_hour_ratio",

    # Data consistency
    "transaction_count_difference",
]


engineered_df = df[
    output_columns
].copy()

engineered_df.to_csv(
    OUTPUT_FILE,
    index=False
)


# ------------------------------------------------------------
# 11. DISPLAY RESULTS
# ------------------------------------------------------------
print("\n===== FEATURE ENGINEERING COMPLETE =====")

print(
    f"Output file: {OUTPUT_FILE}"
)

print(
    f"Rows: {len(engineered_df):,}"
)

print(
    f"Columns: {len(engineered_df.columns)}"
)

print("\n===== MODEL FEATURES =====")

for number, feature in enumerate(
    model_features,
    start=1
):
    print(
        f"{number:02d}. {feature}"
    )

print("\n===== SAMPLE ENGINEERED DATA =====")

print(
    engineered_df[
        [
            "atmId",
            "transactionTime",
            "totalNumberTransaction",
            "totalBalance",
            "net_transaction_flow",
            "income_outcome_ratio",
            "totalNumberTransaction_atm_deviation",
            "volume_vs_hour_baseline",
        ]
    ].head()
)

print("\nDone.")