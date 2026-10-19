import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import {
  filterAnomalies,
  sortRecordsByToken,
  summarizeRecords,
  TIMEFRAMES,
} from '../utils/filters.js'

function buildAnomalySummary(records) {
  const total = records.length
  const anomalies = records.filter((record) => record.isAnomaly)

  const high = anomalies.filter((record) => record.risk === 'High').length
  const medium = anomalies.filter((record) => record.risk === 'Medium').length
  const low = anomalies.filter((record) => record.risk === 'Low').length

  return {
    total,
    anomalies: anomalies.length,
    flagged: anomalies.length,
    normal: total - anomalies.length,
    high,
    medium,
    low,
    anomalyRate: total ? (anomalies.length / total) * 100 : 0,
  }
}

function buildRiskBreakdown(records) {
  const counts = {
    Normal: 0,
    Low: 0,
    Medium: 0,
    High: 0,
  }

  records.filter((record) => record.isAnomaly).forEach((record) => {
    const risk = record.risk || 'Normal'

    if (risk in counts) {
      counts[risk] += 1
    }
  })

  return Object.entries(counts).map(([risk, count]) => ({
    key: risk.toLowerCase(),
    label: risk,
    risk,
    value: count,
    count,
  }))
}

function buildHourlyTrend(records) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    total: 0,
    anomalies: 0,
  }))

  records.forEach((record) => {
    const hour = Number(record.hour)

    if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
      buckets[hour].total += 1

      if (record.isAnomaly) {
        buckets[hour].anomalies += 1
      }
    }
  })

  return buckets.map((bucket) => ({
    label: `${String(bucket.hour).padStart(2, '0')}:00`,
    total: bucket.total,
    anomalies: bucket.anomalies,
  }))
}

function buildAtmBreakdown(records) {
  const grouped = new Map()

  records.forEach((record) => {
    if (!grouped.has(record.atmId)) {
      grouped.set(record.atmId, {
        atmId: record.atmId,
        atmName: `ATM ${record.atmId}`,
        total: 0,
        anomalies: 0,
      })
    }

    const item = grouped.get(record.atmId)

    item.total += 1

    if (record.isAnomaly) {
      item.anomalies += 1
    }
  })

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      anomalyRate: item.total ? (item.anomalies / item.total) * 100 : 0,
    }))
    .sort((a, b) => b.anomalyRate - a.anomalyRate)
}

function buildLocationBreakdown(records) {
  const grouped = new Map()

  records.forEach((record) => {
    const location = record.location

    if (!grouped.has(location)) {
      grouped.set(location, {
        location,
        total: 0,
        anomalies: 0,
      })
    }

    const item = grouped.get(location)

    item.total += 1

    if (record.isAnomaly) {
      item.anomalies += 1
    }
  })

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      anomalyRate: item.total ? (item.anomalies / item.total) * 100 : 0,
    }))
    .sort((a, b) => b.anomalyRate - a.anomalyRate)
}

export async function fetchAnomalies() {
  const records = await loadMlRecords()

  return resolvePayload({
    records,
    summary: buildAnomalySummary(records),
    trend: buildHourlyTrend(records),
    byRisk: buildRiskBreakdown(records),
    byAtm: buildAtmBreakdown(records),
    byLocation: buildLocationBreakdown(records),
    timeframeOptions: TIMEFRAMES,
  })
}

export async function fetchAnomalyById(id) {
  const records = await loadMlRecords()
  const record = records.find((item) => item.id === id) || null

  return resolvePayload(record)
}

export async function fetchAnomalyByTransactionId(transactionId) {
  const records = await loadMlRecords()

  const record =
    records.find((item) => item.transactionId === transactionId) || null

  return resolvePayload(record)
}

export async function fetchAnomaliesForAtm(atmId) {
  const records = await loadMlRecords()

  return resolvePayload(records.filter((record) => record.atmId === atmId && record.isAnomaly))
}

export function queryAnomalies(
  records,
  { filters = {}, sort = 'timestamp-desc' } = {},
) {
  const filtered = filterAnomalies(records, filters)
  const sorted = sortRecordsByToken(filtered, sort)

  return {
    records: sorted,
    totals: summarizeRecords(sorted),
  }
}

export default {
  fetchAnomalies,
  fetchAnomalyById,
  fetchAnomalyByTransactionId,
  fetchAnomaliesForAtm,
  queryAnomalies,
}