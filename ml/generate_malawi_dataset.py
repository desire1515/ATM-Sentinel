#!/usr/bin/env python3
"""Generate and validate a reproducible synthetic Malawi ATM transaction CSV.

Run from the project root with:
    python ml/generate_malawi_dataset.py

Only Python's standard library is required. The existing
dataset/atm_transactions.csv is not read, changed, or replaced.
"""

from __future__ import annotations

import csv
import io
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any


SEED = 20261012
RECORD_COUNT = 50_000
ATM_COUNT = 100
ANOMALY_COUNT = 2_500
FIRST_DATE = datetime(2025, 1, 1)
DATE_RANGE_DAYS = 365
CURRENCY = "MWK"
DATA_SOURCE = "SYNTHETIC_MALAWI_DEMONSTRATION"

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = PROJECT_ROOT / "dataset" / "atm_transactions_malawi_synthetic.csv"
REPORT_PATH = PROJECT_ROOT / "dataset" / "malawi_dataset_validation.txt"

CSV_COLUMNS = [
    "transaction_id",
    "atm_id",
    "city",
    "location",
    "atm_latitude",
    "atm_longitude",
    "transaction_datetime",
    "transaction_date",
    "transaction_hour",
    "day_of_week",
    "is_weekend",
    "transaction_type",
    "transaction_amount_mwk",
    "transaction_amount",
    "currency",
    "account_id",
    "transaction_status",
    "balance_after_mwk",
    "is_anomaly",
    "ground_truth_anomaly",
    "anomaly_type",
    "data_source",
    "is_live_bank_data",
]

# Approximate town-center coordinates used only as synthetic seeds. Each
# simulated ATM gets a small deterministic offset; none represents an actual
# ATM installation.
TOWNS = [
    ("Lilongwe", -13.9626, 33.7741),
    ("Blantyre", -15.7861, 35.0058),
    ("Mzuzu", -11.4656, 34.0207),
    ("Zomba", -15.3850, 35.3188),
    ("Mangochi", -14.4782, 35.2645),
    ("Kasungu", -13.0333, 33.4833),
    ("Salima", -13.7804, 34.4587),
    ("Dedza", -14.3779, 34.3332),
    ("Karonga", -9.9333, 33.9333),
    ("Liwonde", -15.0667, 35.2333),
    ("Mchinji", -13.8000, 32.9000),
    ("Balaka", -14.9833, 34.9500),
    ("Nkhotakota", -12.9167, 34.3000),
    ("Ntcheu", -14.8167, 34.6333),
    ("Chitipa", -9.7000, 33.2667),
    ("Rumphi", -11.0167, 33.8667),
    ("Mulanje", -16.0333, 35.5000),
    ("Nkhata Bay", -11.6000, 34.2833),
]

NORMAL_HOURS = list(range(6, 23))
NORMAL_HOUR_WEIGHTS = [1, 2, 3, 5, 7, 9, 10, 10, 9, 8, 7, 7, 8, 9, 10, 8, 5]
NORMAL_TRANSACTION_TYPES = [
    "WITHDRAWAL",
    "DEPOSIT",
    "BALANCE_INQUIRY",
    "TRANSFER",
]
NORMAL_TYPE_WEIGHTS = [56, 14, 18, 12]
ANOMALY_TYPES = [
    "LARGE_WITHDRAWAL",
    "UNUSUAL_HOUR",
    "LARGE_TRANSFER",
    "REPEATED_WITHDRAWALS",
    "UNUSUAL_FAILURE_PATTERN",
]


def make_atms(rng: random.Random) -> list[dict[str, Any]]:
    """Create 100 stable, simulated ATM identities and town locations."""
    atms = []
    for index in range(ATM_COUNT):
        city, base_latitude, base_longitude = TOWNS[index % len(TOWNS)]
        atms.append(
            {
                "atm_id": f"MW-ATM-{index + 1:03d}",
                "city": city,
                "location": (
                    f"Simulated zone {index + 1:03d} "
                    "(not a verified ATM site)"
                ),
                "atm_latitude": f"{base_latitude + rng.uniform(-0.025, 0.025):.6f}",
                "atm_longitude": f"{base_longitude + rng.uniform(-0.025, 0.025):.6f}",
            }
        )
    return atms


def random_datetime(rng: random.Random, hour: int | None = None) -> datetime:
    """Return a timestamp in 2025, weighted toward daytime activity."""
    date = FIRST_DATE + timedelta(days=rng.randrange(DATE_RANGE_DAYS))
    if hour is None:
        hour = rng.choices(NORMAL_HOURS, weights=NORMAL_HOUR_WEIGHTS, k=1)[0]
    return date.replace(
        hour=hour,
        minute=rng.randrange(60),
        second=rng.randrange(60),
    )


def make_account_pool() -> list[str]:
    """Create clearly synthetic identifiers that cannot identify real customers."""
    return [f"SYN-ACCT-{number:08d}" for number in range(1, 12_001)]


def build_transaction(
    rng: random.Random,
    atms: list[dict[str, Any]],
    account_pool: list[str],
    anomaly_type: str = "NONE",
    *,
    atm: dict[str, Any] | None = None,
    account_id: str | None = None,
    timestamp: datetime | None = None,
) -> dict[str, Any]:
    """Create one normal or deliberately injected synthetic transaction."""
    selected_atm = atm if atm is not None else rng.choice(atms)
    selected_account = account_id if account_id is not None else rng.choice(account_pool)
    is_anomaly = anomaly_type != "NONE"

    if anomaly_type == "LARGE_WITHDRAWAL":
        transaction_type = "WITHDRAWAL"
        amount = rng.randrange(80_000, 300_001)
        timestamp = timestamp or random_datetime(rng)
        status = "SUCCESS"
    elif anomaly_type == "UNUSUAL_HOUR":
        transaction_type = rng.choice(["WITHDRAWAL", "TRANSFER"])
        amount = rng.randrange(1_000, 70_001)
        timestamp = timestamp or random_datetime(rng, hour=rng.randrange(0, 5))
        status = rng.choices(["SUCCESS", "FAILED", "DECLINED"], [75, 15, 10], k=1)[0]
    elif anomaly_type == "LARGE_TRANSFER":
        transaction_type = "TRANSFER"
        amount = rng.randrange(100_000, 500_001)
        timestamp = timestamp or random_datetime(rng)
        status = "SUCCESS"
    elif anomaly_type == "REPEATED_WITHDRAWALS":
        transaction_type = "WITHDRAWAL"
        amount = rng.randrange(20_000, 100_001)
        timestamp = timestamp or random_datetime(rng)
        status = "SUCCESS"
    elif anomaly_type == "UNUSUAL_FAILURE_PATTERN":
        transaction_type = rng.choice(["CARDLESS_WITHDRAWAL", "TRANSFER"])
        amount = rng.randrange(1_000, 80_001)
        timestamp = timestamp or random_datetime(rng)
        status = rng.choice(["FAILED", "DECLINED"])
    else:
        transaction_type = rng.choices(
            NORMAL_TRANSACTION_TYPES, weights=NORMAL_TYPE_WEIGHTS, k=1
        )[0]
        amount = (
            0
            if transaction_type == "BALANCE_INQUIRY"
            else rng.randrange(500, 60_001)
        )
        timestamp = timestamp or random_datetime(rng)
        status = rng.choices(["SUCCESS", "FAILED", "DECLINED"], [94, 4, 2], k=1)[0]

    # Amounts represent attempted transaction amounts. Balances are synthetic
    # snapshots, not reconciled against any real account ledger.
    balance_after = rng.randrange(0, 1_500_001)
    timestamp_text = timestamp.strftime("%Y-%m-%d %H:%M:%S")
    amount_text = f"{amount:.2f}"
    return {
        "atm_id": selected_atm["atm_id"],
        "city": selected_atm["city"],
        "location": selected_atm["location"],
        "atm_latitude": selected_atm["atm_latitude"],
        "atm_longitude": selected_atm["atm_longitude"],
        "transaction_datetime": timestamp_text,
        "transaction_date": timestamp.strftime("%Y-%m-%d"),
        "transaction_hour": timestamp.hour,
        "day_of_week": timestamp.strftime("%A"),
        "is_weekend": int(timestamp.weekday() >= 5),
        "transaction_type": transaction_type,
        "transaction_amount_mwk": amount_text,
        "transaction_amount": amount_text,
        "currency": CURRENCY,
        "account_id": selected_account,
        "transaction_status": status,
        "balance_after_mwk": f"{balance_after:.2f}",
        "is_anomaly": int(is_anomaly),
        "ground_truth_anomaly": int(is_anomaly),
        "anomaly_type": anomaly_type,
        "data_source": DATA_SOURCE,
        "is_live_bank_data": "false",
    }


def generate_records(seed: int = SEED) -> list[dict[str, Any]]:
    """Build exactly 50,000 deterministic transactions with 2,500 anomalies."""
    rng = random.Random(seed)
    atms = make_atms(rng)
    account_pool = make_account_pool()
    records = [
        build_transaction(rng, atms, account_pool)
        for _ in range(RECORD_COUNT - ANOMALY_COUNT)
    ]

    # Five equally sized, interpretable anomaly groups give exactly 2,500
    # injected records. Repeated-withdrawal anomalies are emitted in groups of
    # five sharing one synthetic account, ATM, date, and short time window.
    for anomaly_type in ANOMALY_TYPES:
        if anomaly_type == "REPEATED_WITHDRAWALS":
            for _ in range(ANOMALY_COUNT // len(ANOMALY_TYPES) // 5):
                atm = rng.choice(atms)
                account_id = rng.choice(account_pool)
                start = random_datetime(rng)
                start = start.replace(second=0)
                for offset in range(5):
                    records.append(
                        build_transaction(
                            rng,
                            atms,
                            account_pool,
                            anomaly_type,
                            atm=atm,
                            account_id=account_id,
                            timestamp=start + timedelta(minutes=offset * 3),
                        )
                    )
        else:
            records.extend(
                build_transaction(rng, atms, account_pool, anomaly_type)
                for _ in range(ANOMALY_COUNT // len(ANOMALY_TYPES))
            )

    rng.shuffle(records)
    for number, record in enumerate(records, start=1):
        record["transaction_id"] = f"MW-TXN-{number:06d}"
    return records


def render_csv(records: list[dict[str, Any]]) -> str:
    output = io.StringIO(newline="")
    writer = csv.DictWriter(
        output,
        fieldnames=CSV_COLUMNS,
        extrasaction="raise",
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(records)
    return output.getvalue()


def validate_csv(csv_text: str) -> list[str]:
    """Run the required content, structure, date, and privacy validations."""
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    failures: list[str] = []

    if reader.fieldnames != CSV_COLUMNS:
        failures.append("CSV columns do not exactly match the required ordered schema.")
    if len(rows) != RECORD_COUNT:
        failures.append(f"Expected {RECORD_COUNT} records; found {len(rows)}.")

    if len({row.get("atm_id", "") for row in rows}) != ATM_COUNT:
        failures.append(f"Expected exactly {ATM_COUNT} unique ATM IDs.")
    anomaly_count = sum(row.get("ground_truth_anomaly") == "1" for row in rows)
    if anomaly_count != ANOMALY_COUNT:
        failures.append(f"Expected {ANOMALY_COUNT} ground-truth anomalies; found {anomaly_count}.")
    if len({row.get("transaction_id", "") for row in rows}) != len(rows):
        failures.append("Duplicate transaction IDs were found.")

    missing_count = sum(
        1 for row in rows for column in CSV_COLUMNS if not row.get(column, "").strip()
    )
    if missing_count:
        failures.append(f"Found {missing_count} missing required values.")

    forbidden_location_terms = ("izmir", "turkey", "aliağa", "aliaga", "ataturk", "atatürk")
    if any(
        term in (row.get("city", "") + " " + row.get("location", "")).casefold()
        for row in rows
        for term in forbidden_location_terms
    ):
        failures.append("A Turkish city or location label was found.")

    bad_values = 0
    for row in rows:
        if row.get("currency") != CURRENCY:
            bad_values += 1
        if row.get("data_source") != DATA_SOURCE or row.get("is_live_bank_data") != "false":
            bad_values += 1
        if row.get("is_anomaly") != row.get("ground_truth_anomaly"):
            bad_values += 1
        label = row.get("ground_truth_anomaly")
        if label not in {"0", "1"}:
            bad_values += 1
        if (label == "1") != (row.get("anomaly_type") not in {"", "NONE"}):
            bad_values += 1
        try:
            amount = float(row["transaction_amount_mwk"])
            amount_alias = float(row["transaction_amount"])
            balance = float(row["balance_after_mwk"])
            timestamp = datetime.strptime(
                row["transaction_datetime"], "%Y-%m-%d %H:%M:%S"
            )
            if (
                not math.isfinite(amount)
                or not math.isfinite(balance)
                or amount < 0
                or balance < 0
                or amount != amount_alias
                or row["transaction_date"] != timestamp.strftime("%Y-%m-%d")
                or int(row["transaction_hour"]) != timestamp.hour
                or row["day_of_week"] != timestamp.strftime("%A")
                or int(row["is_weekend"]) != int(timestamp.weekday() >= 5)
            ):
                bad_values += 1
        except (KeyError, ValueError, OverflowError):
            bad_values += 1
    if bad_values:
        failures.append(f"Found {bad_values} invalid currency, label, amount, date, or metadata values.")

    return failures


def create_validation_report(record_count: int) -> str:
    return f"""ATM SENTINEL - SYNTHETIC MALAWI DATASET VALIDATION
===================================================

Dataset: dataset/atm_transactions_malawi_synthetic.csv
Records (excluding header): {record_count:,}
Random seed: {SEED}
Currency: MWK (Malawi Kwacha)
Data origin: Synthetic demonstration data only; not connected to a real bank.
Live bank data: No. is_live_bank_data is false for every row.
ATM locations: Simulated town-level coordinates and zones. These are not
verified installations and do not identify real ATM sites.
Accounts: SYN-ACCT identifiers are generated solely for this dataset.
Labels: The injected labels are demonstration ground truth, not evidence of
actual fraud. is_anomaly duplicates ground_truth_anomaly in this initial file;
neither column represents a model prediction.

AUTOMATED VALIDATION
--------------------
PASS: exactly {RECORD_COUNT:,} data records, excluding the header
PASS: exactly {ATM_COUNT} unique stable ATM IDs
PASS: exactly {ANOMALY_COUNT:,} ground-truth anomalies (5% of all records)
PASS: transaction IDs are unique
PASS: all required values are present
PASS: transaction amounts are non-negative, finite MWK values
PASS: timestamps are valid and date/hour/day/weekend columns agree
PASS: currency is MWK and anomaly labels agree with the injected type
PASS: no Turkish city or location labels detected
PASS: same seed produces byte-for-byte identical CSV content

EXISTING PROJECT SCHEMA AND COMPATIBILITY
-----------------------------------------
The current source file dataset/atm_transactions.csv has these columns:
atmId, atmName, atmCity, atmAddress, totalBalance,
numberIncomeTransaction, numberOutcomeTransaction, totalIncome, totalOutcome,
totalNumberTransaction, day, transactionTime.

It is an ATM/time-bucket aggregate, not a transaction-level table. The existing
ML feature engineering expects those aggregate fields; frontend ML data
loading uses precomputed output fields such as anomaly_prediction,
anomaly_score, and risk_level. This generated transaction CSV does not provide
those model outputs and the existing pipeline/UI has not been changed.

Suggested migration (requires explicit downstream code changes):
* atmId <- atm_id; atmCity <- city; atmAddress <- location.
* atmName has no direct equivalent; use atm_id as a synthetic display label
  only if the consumer requires a name.
* transactionTime <- transaction_datetime; day <- day_of_week.
* First aggregate rows by atm_id and the desired interval (for example, hour).
* totalNumberTransaction <- count of transactions in that interval.
* numberIncomeTransaction / totalIncome <- counts / sums for deposits.
* numberOutcomeTransaction / totalOutcome <- counts / sums for withdrawals
  and transfers. Define explicitly whether failed attempts are included.
* totalBalance <- an explicitly chosen synthetic balance summary, such as the
  last balance_after_mwk in the interval; this is not a reconciled ledger.

The mapping above is illustrative: the row grain and metric definitions differ.
Do not map ground_truth_anomaly or is_anomaly into model input features. Keep
both labels out of prediction-time features to avoid leakage. Also exclude
transaction_id and account_id from model inputs; identifiers are not behavioral
features. Keep model predictions in separate output columns produced by an
actual model. No model was trained or evaluated by this generator.

GENERATION
----------
Run from the project root: python ml/generate_malawi_dataset.py
The script uses only the Python standard library; pandas is not required.
It writes this CSV and report to new Malawi-specific paths and leaves the
existing dataset/atm_transactions.csv untouched.
"""


def main() -> None:
    records = generate_records()
    csv_text = render_csv(records)

    # Verify determinism independently by generating the data again from the
    # same seed before writing anything to disk.
    reproducible = render_csv(generate_records()) == csv_text
    failures = validate_csv(csv_text)
    if not reproducible:
        failures.append("Regeneration with the same seed was not byte-for-byte identical.")
    if failures:
        raise RuntimeError("Dataset validation failed:\n- " + "\n- ".join(failures))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(csv_text, encoding="utf-8", newline="")
    REPORT_PATH.write_text(
        create_validation_report(len(records)),
        encoding="utf-8",
        newline="",
    )

    print(f"Generated: {OUTPUT_PATH}")
    print(f"Validation report: {REPORT_PATH}")
    print("PASS: exactly 50,000 records (header excluded)")
    print("PASS: exactly 100 unique ATM IDs")
    print("PASS: exactly 2,500 ground-truth anomaly labels (5%)")
    print("PASS: unique transaction IDs and no missing required values")
    print("PASS: valid amounts, timestamps, MWK currency, and consistent labels")
    print("PASS: no Turkish city or location labels")
    print("PASS: same seed produces byte-for-byte identical CSV content")
    print("PASS: existing dataset/atm_transactions.csv was not modified")


if __name__ == "__main__":
    main()
