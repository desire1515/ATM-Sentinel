import pandas as pd

file_path = "dataset/atm_transactions.csv"

df = pd.read_csv(file_path)

# Convert timestamp
df["transactionTime"] = pd.to_datetime(df["transactionTime"])

print("\n===== DATE/TIME RANGE =====")
print("Start:", df["transactionTime"].min())
print("End:", df["transactionTime"].max())

print("\n===== UNIQUE ATMS =====")
print(df["atmId"].nunique())

print("\n===== OBSERVATIONS PER ATM =====")
print(df.groupby("atmId").size().describe())

print("\n===== NUMERIC COLUMNS =====")
numeric_columns = [
    "totalBalance",
    "numberIncomeTransaction",
    "numberOutcomeTransaction",
    "totalIncome",
    "totalOutcome",
    "totalNumberTransaction"
]

print(df[numeric_columns].describe().T)

print("\n===== HOURLY TRANSACTION ACTIVITY =====")
df["hour"] = df["transactionTime"].dt.hour

print(
    df.groupby("hour")["totalNumberTransaction"]
    .mean()
    .round(2)
)

print("\n===== DAILY TRANSACTION ACTIVITY =====")
print(
    df.groupby("day")["totalNumberTransaction"]
    .mean()
    .round(2)
)

print("\n===== FEATURE CORRELATION =====")
print(
    df[numeric_columns]
    .corr()
    .round(2)
)

print("\n===== TOP 10 ATM OBSERVATIONS BY TRANSACTION VOLUME =====")
print(
    df.nlargest(10, "totalNumberTransaction")[
        [
            "atmId",
            "atmName",
            "transactionTime",
            "totalNumberTransaction",
            "totalIncome",
            "totalOutcome",
            "totalBalance"
        ]
    ].to_string(index=False)
)