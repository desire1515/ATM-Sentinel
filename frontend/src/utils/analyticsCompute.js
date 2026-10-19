import { averageBy, bucketize, countBy, medianBy, shortDayLabel } from './aggregate.js'
import { round } from './random.js'
import { datasetDayKey } from './format.js'

function buildScoreRanges(records) {
  const scores = records.map((record) => Number(record.anomalyScore)).filter(Number.isFinite)
  if (!scores.length) return []
  const minimum = Math.floor(Math.min(...scores) * 100) / 100
  const maximum = Math.ceil(Math.max(...scores) * 100) / 100 + 0.01
  const width = (maximum - minimum) / 8
  return Array.from({ length: 8 }, (_, index) => {
    const min = minimum + width * index
    const max = index === 7 ? maximum + Number.EPSILON : minimum + width * (index + 1)
    return {
      min,
      max,
      label: `${min.toFixed(3)} to ${max.toFixed(3)}`,
    }
  })
}

function buildMatcher(records, { period = 'all', atmId = 'all', type = 'all', risk = 'all', location = 'all' }) {
  const hours = { '24h': 24, '7d': 24 * 7, '14d': 24 * 14 }[period]
  const latest = records.reduce(
    (max, record) => Math.max(max, new Date(record.timestamp).getTime()),
    Number.NEGATIVE_INFINITY,
  )
  const threshold = hours ? latest - hours * 60 * 60 * 1000 : null

  return (record) => {
    if (threshold !== null && new Date(record.timestamp).getTime() < threshold) return false
    if (atmId !== 'all' && record.atmId !== atmId) return false
    if (type !== 'all' && record.type !== type) return false
    if (risk !== 'all' && record.risk !== risk) return false
    if (location !== 'all' && record.location !== location) return false
    return true
  }
}

function dayKey(record) {
  return datasetDayKey(record.timestamp)
}

export function computeAnalytics({ transactions = [], anomalies = [], filters = {} }) {
  const matcher = buildMatcher(transactions, filters)
  const records = transactions.filter(matcher)
  const flagged = anomalies.filter(matcher)
  const normal = records.filter((record) => !record.isAnomaly)
  const anomalous = records.filter((record) => record.isAnomaly)

  const transactionDays = countBy(records, dayKey)
  const anomalyDays = countBy(flagged, dayKey)
  const volumeSeries = Object.keys(transactionDays)
    .sort()
    .map((day) => {
      const transactionsForDay = transactionDays[day] ?? 0
      const anomaliesForDay = anomalyDays[day] ?? 0
      return {
        day,
        label: shortDayLabel(day),
        transactions: transactionsForDay,
        anomalies: anomaliesForDay,
        anomalyRate: transactionsForDay
          ? round((anomaliesForDay / transactionsForDay) * 100, 2)
          : 0,
      }
    })

  const amountDistribution = bucketize(
    records,
    (record) => record.amount,
    [
      { label: 'MWK 0', min: 0, max: 1 },
      { label: 'MWK 1–9,999', min: 1, max: 10_000 },
      { label: 'MWK 10,000–24,999', min: 10_000, max: 25_000 },
      { label: 'MWK 25,000–49,999', min: 25_000, max: 50_000 },
      { label: 'MWK 50,000–99,999', min: 50_000, max: 100_000 },
      { label: 'MWK 100,000–249,999', min: 100_000, max: 250_000 },
      { label: 'MWK 250,000+', min: 250_000, max: Number.POSITIVE_INFINITY },
    ],
    (record) => (record.isAnomaly ? 'Anomalous' : 'Normal'),
  ).map(({ label, Normal = 0, Anomalous = 0 }) => ({ label, Normal, Anomalous }))

  const hourDistribution = Array.from({ length: 24 }, (_, hour) => {
    const hourRecords = records.filter((record) => Number(record.hour) === hour)
    return {
      label: `${String(hour).padStart(2, '0')}:00`,
      hour,
      Normal: hourRecords.filter((record) => !record.isAnomaly).length,
      Anomalous: hourRecords.filter((record) => record.isAnomaly).length,
    }
  })

  const scoreDistribution = bucketize(
    records,
    (record) => record.anomalyScore,
    buildScoreRanges(records),
    (record) => (record.isAnomaly ? 'Anomalous' : 'Normal'),
  ).map(({ label, Normal = 0, Anomalous = 0 }) => ({ label, Normal, Anomalous }))

  const byAtm = Object.entries(countBy(flagged, (record) => record.atmId))
    .map(([atmId, count]) => {
      const items = flagged.filter((record) => record.atmId === atmId)
      return {
        atmId,
        label: atmId,
        anomalies: count,
        high: items.filter((item) => item.risk === 'High').length,
        medium: items.filter((item) => item.risk === 'Medium').length,
        low: items.filter((item) => item.risk === 'Low').length,
      }
    })
    .sort((left, right) => right.anomalies - left.anomalies)

  const byLocation = Object.entries(countBy(flagged, (record) => record.location))
    .map(([location, count]) => ({ label: location, location, anomalies: count }))
    .sort((left, right) => right.anomalies - left.anomalies)

  const nightShare = (items) =>
    items.length
      ? round(
          (items.filter((record) => Number(record.hour) <= 5 || Number(record.hour) >= 23).length /
            items.length) *
            100,
          1,
        )
      : 0

  const normalVsAnomaly = [
    {
      metric: 'Average transaction amount',
      Normal: round(averageBy(normal, (record) => record.amount), 2),
      Anomalous: round(averageBy(anomalous, (record) => record.amount), 2),
      unit: 'currency',
    },
    {
      metric: 'Median transaction amount',
      Normal: round(medianBy(normal, (record) => record.amount), 2),
      Anomalous: round(medianBy(anomalous, (record) => record.amount), 2),
      unit: 'currency',
    },
    {
      metric: 'Night activity share',
      Normal: nightShare(normal),
      Anomalous: nightShare(anomalous),
      unit: 'percent',
    },
    { metric: 'Observations', Normal: normal.length, Anomalous: anomalous.length, unit: 'count' },
  ]

  const peakHour = hourDistribution.reduce(
    (peak, entry) =>
      entry.Normal + entry.Anomalous > peak.Normal + peak.Anomalous ? entry : peak,
    hourDistribution[0],
  )
  const topType = Object.entries(countBy(anomalous, (record) => record.type)).sort(
    (left, right) => right[1] - left[1],
  )[0]
  const flaggedTransactionCount = anomalous.length

  return {
    filteredCounts: {
      transactions: records.length,
      anomalies: flagged.length,
      normal: normal.length,
      anomalous: anomalous.length,
      anomalyRate: records.length ? round((anomalous.length / records.length) * 100, 2) : 0,
    },
    volumeSeries,
    amountDistribution,
    hourDistribution,
    scoreDistribution,
    byAtm,
    byLocation,
    normalVsAnomaly,
    statistics: {
      averageTransactionCount: round(averageBy(records, (record) => record.transactionCount), 2),
      flaggedTransactionCount,
      peakHour: peakHour?.label ?? '—',
      topAnomalousType: topType ? `${topType[0]} (${topType[1]})` : '—',
      daysCovered: volumeSeries.length,
    },
  }
}

export default computeAnalytics
