/**
 * Frontend filter, search and sorting helpers for ATM Sentinel.
 *
 * These helpers operate on synthetic Malawi transactions classified by the
 * precomputed Isolation Forest model predictions.
 */

export const TIMEFRAMES = [
  { value: '24h', label: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { value: '14d', label: 'Last 14 days', hours: 24 * 14 },
  { value: 'all', label: 'Full dataset window', hours: null },
]

export const TRANSACTION_RISK_OPTIONS = [
  { value: 'all', label: 'All risk levels' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
]

export const TRANSACTION_SORT_OPTIONS = [
  { value: 'timestamp-desc', label: 'Newest first' },
  { value: 'timestamp-asc', label: 'Oldest first' },
  { value: 'score-desc', label: 'Review flag: flagged first' },
  { value: 'score-asc', label: 'Review flag: normal first' },
  { value: 'amount-desc', label: 'Amount: high to low' },
  { value: 'amount-asc', label: 'Amount: low to high' },
  { value: 'atmId-asc', label: 'ATM ID' },
]

export const ANOMALY_SORT_OPTIONS = [
  { value: 'timestamp-desc', label: 'Most recent' },
  { value: 'timestamp-asc', label: 'Oldest first' },
  { value: 'score-desc', label: 'Review flag: flagged first' },
  { value: 'score-asc', label: 'Review flag: normal first' },
  { value: 'amount-desc', label: 'Amount: high to low' },
  { value: 'amount-asc', label: 'Amount: low to high' },
  { value: 'risk-desc', label: 'Risk: high to low' },
]

const RISK_ORDER = {
  Normal: 0,
  Low: 1,
  Medium: 2,
  High: 3,
}

const SORT_ACCESSORS = {
  timestamp: (record) => new Date(record.timestamp).getTime(),
  score: (record) => Number(record.anomalyScore) || 0,
  amount: (record) => Number(record.amount) || 0,
  risk: (record) => RISK_ORDER[record.risk] ?? 0,
  atmId: (record) => record.atmId || '',
  type: (record) => record.type || '',
  id: (record) => record.id || '',
}

function matchesQuery(record, query) {
  if (!query) return true

  const needle = query.trim().toLowerCase()

  if (!needle) return true

  return [
    record.id,
    record.transactionId,
    record.atmId,
    record.branch,
    record.location,
    record.type,
    record.status,
    record.detectionStatus,
    record.risk,
    record.transactionTime,
    record.atmCity,
    record.amount,
  ]
    .filter(Boolean)
    .some((field) =>
      String(field).toLowerCase().includes(needle),
    )
}

function withinTimeframe(record, timeframe, referenceTime) {
  const option = TIMEFRAMES.find(
    (entry) => entry.value === timeframe,
  )

  if (!option || option.hours === null) {
    return true
  }

  const timestamp = new Date(record.timestamp).getTime()

  if (!Number.isFinite(timestamp)) {
    return false
  }

  /*
   * This static synthetic dataset has a fixed historical window, so relative
   * time filters are measured from its latest timestamp rather than now.
   */
  const threshold =
    (referenceTime ?? Date.now()) - option.hours * 60 * 60 * 1000

  return timestamp >= threshold
}

export function filterTransactions(records, filters = {}, referenceTime) {
  const latestRecordTime = getDatasetTimeRange(records).latest
  const effectiveReferenceTime = referenceTime ?? latestRecordTime ?? Date.now()
  const {
    query = '',
    atmId = 'all',
    location = 'all',
    type = 'all',
    risk = 'all',
    status = 'all',
    timeframe = 'all',
    onlyAnomalies = false,
  } = filters

  return records.filter((record) => {
    if (onlyAnomalies && !record.isAnomaly) {
      return false
    }

    if (atmId !== 'all' && record.atmId !== atmId) {
      return false
    }

    if (location !== 'all' && record.location !== location) {
      return false
    }

    if (type !== 'all' && record.type !== type) {
      return false
    }

    if (risk !== 'all' && record.risk !== risk) {
      return false
    }

    if (status !== 'all' && record.status !== status) {
      return false
    }

    if (!withinTimeframe(record, timeframe, effectiveReferenceTime)) {
      return false
    }

    return matchesQuery(record, query)
  })
}

export function filterAnomalies(records, filters = {}, referenceTime) {
  const latestRecordTime = getDatasetTimeRange(records).latest
  const effectiveReferenceTime = referenceTime ?? latestRecordTime ?? Date.now()
  const {
    query = '',
    atmId = 'all',
    location = 'all',
    risk = 'all',
    status = 'all',
    type = 'all',
    timeframe = 'all',
  } = filters

  return records.filter((record) => {
    /*
     * The anomaly page should contain only observations flagged
     * by the precomputed Isolation Forest model.
     */
    if (!record.isAnomaly) {
      return false
    }

    if (atmId !== 'all' && record.atmId !== atmId) {
      return false
    }

    if (location !== 'all' && record.location !== location) {
      return false
    }

    if (risk !== 'all' && record.risk !== risk) {
      return false
    }

    if (
      status !== 'all' &&
      record.detectionStatus !== status
    ) {
      return false
    }

    if (type !== 'all' && record.type !== type) {
      return false
    }

    if (!withinTimeframe(record, timeframe, effectiveReferenceTime)) {
      return false
    }

    return matchesQuery(record, query)
  })
}

export function filterAtms(records, filters = {}) {
  const {
    query = '',
    risk = 'all',
  } = filters

  return records.filter((record) => {
    if (risk !== 'all' && record.risk !== risk) {
      return false
    }

    return matchesQuery(record, query)
  })
}

/**
 * Sort records using a <field>-<direction> token.
 */
export function sortRecordsByToken(
  records,
  token,
  fallback = 'timestamp-desc',
) {
  const [field, direction = 'desc'] = String(
    token || fallback,
  ).split('-')

  const accessor =
    SORT_ACCESSORS[field] ?? SORT_ACCESSORS.timestamp

  const factor = direction === 'asc' ? 1 : -1

  return [...records].sort((a, b) => {
    const left = accessor(a)
    const right = accessor(b)

    if (
      typeof left === 'number' &&
      typeof right === 'number'
    ) {
      return (left - right) * factor
    }

    return (
      String(left).localeCompare(String(right)) *
      factor
    )
  })
}

/**
 * Aggregate statistics for the current filtered records.
 *
 * Each record is one transaction, so its transaction count is one.
 */
export function getDatasetTimeRange(records) {
  const timestamps = records
    .map((record) => new Date(record.timestamp).getTime())
    .filter((ts) => Number.isFinite(ts))

  if (timestamps.length === 0) {
    return { latest: null, earliest: null }
  }

  return {
    latest: Math.max(...timestamps),
    earliest: Math.min(...timestamps),
  }
}

export function summarizeRecords(
  records,
  { anomalyField = 'isAnomaly' } = {},
) {
  return records.reduce(
    (summary, record) => {
      const anomalous =
        anomalyField === 'isAnomaly'
          ? Boolean(record.isAnomaly)
          : Boolean(record.risk)

      summary.total += 1

      if (anomalous) {
        summary.anomalous += 1
      }

      if (record.risk === 'High') {
        summary.high += 1
      }

      if (record.risk === 'Medium') {
        summary.medium += 1
      }

      if (record.risk === 'Low') {
        summary.low += 1
      }

      summary.transactionCount +=
        Number(record.transactionCount) || 0

      return summary
    },
    {
      total: 0,
      anomalous: 0,
      high: 0,
      medium: 0,
      low: 0,
      transactionCount: 0,
    },
  )
}