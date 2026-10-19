import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import { APP_META } from '../utils/constants.js'

const MODEL_FEATURES = [
  ['transaction_amount_mwk', 'Log-transformed transaction amount used as a behavioral input.'],
  ['balance_after_mwk', 'Log-transformed post-transaction balance used as a behavioral input.'],
  ['transaction_datetime', 'Hour and weekday are encoded cyclically to represent time patterns.'],
  ['is_weekend', 'Source-provided weekend indicator.'],
  ['transaction_type', 'Transaction type is represented using one-hot categorical columns.'],
  ['transaction_status', 'Transaction status is represented using one-hot categorical columns.'],
]

const pipelineStages = [
  { id: 'raw', label: 'Synthetic transactions', detail: 'Individual generated Malawi transaction records loaded from the source CSV.', icon: 'Database' },
  { id: 'features', label: 'Behavioral features', detail: 'Amounts, balances, transaction time, weekend, type and status are prepared; identifiers and injected labels are excluded.', icon: 'SlidersHorizontal' },
  { id: 'model', label: 'Isolation Forest', detail: 'The Python script trains a reproducible unsupervised model and assigns a class and decision score to eligible rows.', icon: 'BrainCircuit' },
  { id: 'result', label: 'Precomputed results CSV', detail: 'The generated CSV contains predictions, scores and risk bands used by all dashboard modules.', icon: 'Gauge' },
]

export async function fetchModelOverview() {
  const records = await loadMlRecords()

  return resolvePayload({
    config: {
      algorithm: 'Isolation Forest',
      learningType: 'Unsupervised anomaly detection',
      purpose: 'Identify transactions with behavioral patterns that differ from the synthetic dataset.',
      scoreRange: 'Decision score (not a probability)',
      classification: 'Prediction -1 = Anomaly; prediction 1 = Normal.',
    },
    stages: pipelineStages,
    features: MODEL_FEATURES.map(([id, description]) => ({
      id,
      name: id.replaceAll('_', ' '),
      description,
      status: 'Model input',
    })),
    runs: [],
    status: {
      trained: true,
      resultsAvailable: records.length > 0,
      lastRunAt: null,
      datasetConnected: records.length > 0,
      note: `${records.length.toLocaleString()} precomputed synthetic results are loaded, including ${records.filter((record) => record.isAnomaly).length.toLocaleString()} model flags. The frontend does not retrain the model.`,
      version: APP_META.version,
    },
  })
}

export default { fetchModelOverview }
