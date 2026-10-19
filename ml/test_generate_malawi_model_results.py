import unittest

import numpy as np
import pandas as pd

from ml.generate_malawi_model_results import make_model_features, score_transactions


def sample_transactions(size=100):
    rows = []
    for index in range(size):
        unusual = index >= size - 5
        rows.append(
            {
                "transaction_id": f"TXN-{index:04d}",
                "account_id": f"ACC-{index:04d}",
                "transaction_datetime": (
                    f"2020-01-{1 + index % 28:02d} "
                    f"{'02' if unusual else f'{8 + index % 10:02d}'}:15:00"
                ),
                "transaction_amount_mwk": 5_000_000 if unusual else 25_000 + index,
                "balance_after_mwk": 9_000_000 if unusual else 100_000 + index,
                "is_weekend": int(index % 7 in (5, 6)),
                "transaction_type": "TRANSFER" if unusual else "WITHDRAWAL",
                "transaction_status": "DECLINED" if unusual else "SUCCESS",
                "ground_truth_anomaly": int(unusual),
                "is_anomaly": int(unusual),
                "anomaly_type": "synthetic label",
            }
        )
    return pd.DataFrame(rows)


class MalawiModelResultsTests(unittest.TestCase):
    def test_features_exclude_identifiers_and_injected_labels(self):
        features = make_model_features(sample_transactions())

        self.assertTrue(features.columns.is_unique)
        self.assertFalse(
            {
                "transaction_id",
                "account_id",
                "ground_truth_anomaly",
                "is_anomaly",
                "anomaly_type",
            }.intersection(features.columns)
        )
        self.assertTrue(np.isfinite(features.to_numpy()).all())

    def test_scores_eligible_rows_and_excludes_invalid_feature_values(self):
        records = sample_transactions()
        invalid_rows = records.iloc[:8].copy().astype(
            {
                "transaction_amount_mwk": object,
                "balance_after_mwk": object,
                "transaction_datetime": object,
                "is_weekend": object,
                "transaction_type": object,
                "transaction_status": object,
            }
        )
        invalid_rows.loc[0, "transaction_amount_mwk"] = np.nan
        invalid_rows.loc[1, "transaction_amount_mwk"] = "not-a-number"
        invalid_rows.loc[2, "transaction_amount_mwk"] = -1
        invalid_rows.loc[3, "balance_after_mwk"] = np.inf
        invalid_rows.loc[4, "transaction_datetime"] = "not-a-date"
        invalid_rows.loc[5, "is_weekend"] = 3
        invalid_rows.loc[6, "transaction_type"] = ""
        invalid_rows.loc[7, "transaction_status"] = None
        input_records = pd.concat([records, invalid_rows], ignore_index=True)

        results, excluded_count = score_transactions(input_records)

        self.assertEqual(excluded_count, len(invalid_rows))
        self.assertEqual(len(results), len(records))
        self.assertEqual(set(results["model_prediction"]), {-1, 1})
        self.assertTrue(np.isfinite(results["model_anomaly_score"]).all())
        self.assertEqual(
            (results["model_prediction"] == -1).sum(),
            results["model_is_anomaly"].sum(),
        )
        self.assertTrue(
            (results["ground_truth_anomaly"] == results["is_anomaly"]).all()
        )


if __name__ == "__main__":
    unittest.main()
