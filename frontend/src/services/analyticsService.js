import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import { computeAnalytics } from '../utils/analyticsCompute.js'
import { datasetDayKey } from '../utils/format.js'

function optionsFor(records, key) {
  return [...new Set(records.map((record) => record[key]).filter(Boolean))]
    .sort((left, right) => String(left).localeCompare(String(right)))
    .map((value) => ({ value, label: String(value) }))
}

export async function fetchAnalyticsDataset() {
  const records = await loadMlRecords()
  const anomalies = records.filter((record) => record.isAnomaly)
  const datasetDays = records.map((record) => datasetDayKey(record.timestamp)).filter(Boolean).sort()

  return resolvePayload({
    records,
    transactions: records,
    anomalies,
    normal: records.filter((record) => !record.isAnomaly),
    filterOptions: {
      periods: [
        { value: '24h', label: 'Last 24 hours' },
        { value: '7d', label: 'Last 7 days' },
        { value: '14d', label: 'Last 14 days' },
        { value: 'all', label: 'Full dataset window' },
      ],
      atms: [{ value: 'all', label: 'All ATMs' }, ...optionsFor(records, 'atmId')],
      locations: [{ value: 'all', label: 'All simulated Malawi locations' }, ...optionsFor(records, 'location')],
      types: [{ value: 'all', label: 'All types' }, ...optionsFor(records, 'type')],
      risks: [{ value: 'all', label: 'All risk levels' }, ...optionsFor(records, 'risk')],
    },
    meta: {
      totalTransactions: records.length,
      flaggedAnomalies: anomalies.length,
      normalObservations: records.length - anomalies.length,
      anomalyRate: records.length ? (anomalies.length / records.length) * 100 : 0,
      earliest: datasetDays[0] ?? null,
      latest: datasetDays.at(-1) ?? null,
      currency: 'MWK',
    },
  })
}

export function deriveAnalytics({ transactions, anomalies, filters }) {
  return computeAnalytics({ transactions, anomalies, filters })
}

export default { fetchAnalyticsDataset, deriveAnalytics }
