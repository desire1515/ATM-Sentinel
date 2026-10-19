import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import { datasetDayKey } from '../utils/format.js'
import {
  MALAWI_CONTEXT,
  SYNTHETIC_MALAWI_DATASET,
} from '../config/geography.js'

const reportTypes = [
  {
    id: 'daily-observations',
    name: 'Daily Observation Report',
    description: 'Daily transaction volume and Isolation Forest anomaly counts for the selected period.',
    icon: 'Activity',
    frequency: 'Daily',
    status: 'available',
  },
  {
    id: 'anomaly-detection',
    name: 'Anomaly Detection Report',
    description: 'Transactions flagged by Isolation Forest, with scores and separate threshold-rule comparison.',
    icon: 'TriangleAlert',
    frequency: 'Daily / weekly',
    status: 'available',
  },
  {
    id: 'atm-activity',
    name: 'ATM Activity Report',
    description: 'Isolation Forest anomaly totals grouped by generated ATM identifier.',
    icon: 'Network',
    frequency: 'Weekly',
    status: 'available',
  },
  {
    id: 'risk-summary',
    name: 'Risk Summary Report',
    description: 'Isolation Forest risk-level distribution and transaction-level flag concentration.',
    icon: 'ShieldAlert',
    frequency: 'Weekly / monthly',
    status: 'available',
  },
]

const dateRanges = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'all', label: 'Full dataset window' },
]

const RISK_LEVELS = ['Normal', 'Low', 'Medium', 'High']

// Source timestamps are Malawi local wall-clock values without an offset. Use
// their UTC-shaped numeric value solely for interval arithmetic so a report is
// independent of the browser's local time zone (Malawi has no DST changes).
function reportTimestampMs(timestamp) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timestamp ?? '')
  if (!match) return Number.NaN

  const [, year, month, day, hour, minute, second = '0'] = match
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )
}

function isReviewFlagged(record) {
  return record.isAnomaly
}

function riskLevel(record) {
  return RISK_LEVELS.includes(record.risk) ? record.risk : 'Unknown'
}

function selectRecordsForRange(records, range) {
  const latest = records.reduce((max, record) => {
    const timestamp = reportTimestampMs(record.timestamp)
    return Number.isFinite(timestamp) ? Math.max(max, timestamp) : max
  }, Number.NEGATIVE_INFINITY)
  const hours = { '24h': 24, '7d': 24 * 7 }[range]
  const threshold = hours && Number.isFinite(latest) ? latest - hours * 60 * 60 * 1000 : null
  return threshold === null
    ? records
    : records.filter((record) => reportTimestampMs(record.timestamp) >= threshold)
}

function createReportSummary(selected, range) {
  const anomalies = selected.filter(isReviewFlagged)
  const perAtm = new Map()
  selected.forEach((record) => {
    const counts = perAtm.get(record.atmId) ?? {
      transactions: 0,
      anomalies: 0,
      thresholdRuleFlags: 0,
      high: 0,
      medium: 0,
      low: 0,
      name: `Simulated ATM ${record.atmId}`,
      location: record.location || 'Unavailable',
    }
    counts.transactions += 1
    if (record.thresholdRuleFlagged) counts.thresholdRuleFlags += 1
    if (isReviewFlagged(record)) {
      counts.anomalies += 1
      if (record.risk === 'High') counts.high += 1
      if (record.risk === 'Medium') counts.medium += 1
      if (record.risk === 'Low') counts.low += 1
    }
    perAtm.set(record.atmId, counts)
  })
  const averageAtmAnomalyRate = perAtm.size
    ? [...perAtm.values()].reduce(
        (total, counts) => total + (counts.anomalies / counts.transactions) * 100,
        0,
      ) / perAtm.size
    : 0
  const highRiskAtms = new Set(
    anomalies.filter((record) => record.risk === 'High').map((record) => record.atmId),
  )
  const totalTransactionCount = selected.length
  const days = new Set(selected.map((record) => datasetDayKey(record.timestamp)).filter(Boolean))
  const dates = [...days].sort()
  const dailyTotals = new Map()
  selected.forEach((record) => {
    const day = datasetDayKey(record.timestamp) || 'Unknown'
    const totals = dailyTotals.get(day) ?? { transactions: 0, anomalies: 0 }
    totals.transactions += 1
    if (isReviewFlagged(record)) totals.anomalies += 1
    dailyTotals.set(day, totals)
  })
  const riskDistribution = Object.fromEntries([...RISK_LEVELS, 'Unknown'].map((risk) => [risk, 0]))
  const flaggedRiskDistribution = Object.fromEntries([...RISK_LEVELS, 'Unknown'].map((risk) => [risk, 0]))
  selected.forEach((record) => {
    const risk = riskLevel(record)
    riskDistribution[risk] += 1
    if (isReviewFlagged(record)) flaggedRiskDistribution[risk] += 1
  })
  const unknownRiskCount = riskDistribution.Unknown
  const unknownFlaggedRiskCount = flaggedRiskDistribution.Unknown
  const atmSummaries = [...perAtm.entries()]
    .map(([atmId, counts]) => {
      return {
        atmId,
        name: counts.name,
        location: counts.location,
        transactions: counts.transactions,
        anomalies: counts.anomalies,
        thresholdRuleFlags: counts.thresholdRuleFlags,
        high: counts.high,
        medium: counts.medium,
        low: counts.low,
        anomalyRate: counts.transactions ? (counts.anomalies / counts.transactions) * 100 : 0,
      }
    })
    .sort((left, right) => right.transactions - left.transactions || String(left.atmId).localeCompare(String(right.atmId)))
  const timestamps = selected
    .map((record) => record.timestamp)
    .filter((timestamp) => Number.isFinite(reportTimestampMs(timestamp)))
    .sort()

  return {
    range: dateRanges.find((item) => item.value === range)?.label ?? dateRanges[2].label,
    generatedAt: new Date(),
    dataSource: SYNTHETIC_MALAWI_DATASET.label,
    locationMode: 'Simulated Malawi ATM coordinates',
    locationNote: SYNTHETIC_MALAWI_DATASET.locationNote,
    sourcePath: SYNTHETIC_MALAWI_DATASET.rawSourcePath,
    resultsPath: SYNTHETIC_MALAWI_DATASET.sourcePath,
    provenance: SYNTHETIC_MALAWI_DATASET.provenance,
    currencyNote: SYNTHETIC_MALAWI_DATASET.currencyNote,
    anomalyCaveat: SYNTHETIC_MALAWI_DATASET.anomalyNote,
    operationalContext: `${MALAWI_CONTEXT.mode}; no rows describe actual banking activity or verified ATM installations.`,
    dateRange: {
      earliest: dates[0] ?? null,
      latest: dates.at(-1) ?? null,
      earliestTimestamp: timestamps[0] ?? null,
      latestTimestamp: timestamps.at(-1) ?? null,
      timeZone: MALAWI_CONTEXT.timeZone,
    },
    totalTransactions: totalTransactionCount,
    totalAnomalies: anomalies.length,
    thresholdRuleFlags: selected.filter((record) => record.thresholdRuleFlagged).length,
    groundTruthAnomalies: selected.filter((record) => record.groundTruthAnomaly).length,
    highRiskAnomalies: anomalies.filter((record) => record.risk === 'High').length,
    anomalyRate: selected.length ? (anomalies.length / selected.length) * 100 : 0,
    riskDistribution,
    flaggedRiskDistribution,
    unknownRiskCount,
    unknownFlaggedRiskCount,
    atmSummaries,
    dailySummaries: [...dailyTotals.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, totals]) => ({ date, ...totals })),
    anomalyRecords: anomalies,
    atmActivity: {
      monitored: perAtm.size,
      highRisk: highRiskAtms.size,
      averageAnomalyRate: averageAtmAnomalyRate,
    },
    dailyAverage: days.size ? selected.length / days.size : 0,
  }
}

function escapeCsv(value) {
  const text = String(value ?? '')
  const safeText =
    typeof value === 'string' && /^[=+\-@\t\r]/.test(text)
      ? `'${text}`
      : text
  return /[",\r\n]/.test(safeText) ? `"${safeText.replace(/"/g, '""')}"` : safeText
}

function reportSpecificRows(reportName, summary) {
  if (reportName === 'Daily Observation Report') {
    return [
      [],
      ['Report-specific section', 'Daily transaction and model-anomaly totals'],
      ['Date', 'Transactions', 'Isolation Forest anomalies'],
      ...summary.dailySummaries.map((day) => [day.date, day.transactions, day.anomalies]),
    ]
  }

  if (reportName === 'Anomaly Detection Report') {
    const highestScores = [...summary.anomalyRecords]
      .sort((left, right) => right.modelAnomalyScore - left.modelAnomalyScore)
      .slice(0, 100)
    return [
      [],
      ['Report-specific section', 'Highest-scoring Isolation Forest anomalies (top 100)'],
      ['Transaction ID', 'Timestamp', 'ATM ID', 'Prediction', 'Anomaly score', 'Model risk', 'Separate threshold-rule flag'],
      ...highestScores.map((record) => [
        record.transactionId,
        record.timestamp,
        record.atmId,
        record.modelPrediction,
        record.modelAnomalyScore,
        record.risk,
        record.thresholdRuleFlagged ? 1 : 0,
      ]),
    ]
  }

  if (reportName === 'ATM Activity Report') {
    return [
      [],
      ['Report-specific section', 'Transaction and model anomalies by simulated ATM'],
      ['ATM ID', 'Location', 'Transactions', 'Isolation Forest anomalies', 'Model anomaly rate (%)'],
      ...summary.atmSummaries.map((atm) => [
        atm.atmId,
        atm.location,
        atm.transactions,
        atm.anomalies,
        atm.anomalyRate.toFixed(2),
      ]),
    ]
  }

  if (reportName === 'Risk Summary Report') {
    return [
      [],
      ['Report-specific section', 'Isolation Forest risk-level distribution'],
      ['Model risk level', 'All transactions', 'Model-flagged anomalies'],
      ...Object.entries(summary.riskDistribution).map(([risk, count]) => [
        risk,
        count,
        summary.flaggedRiskDistribution[risk],
      ]),
    ]
  }

  return []
}

export async function fetchReportOverview(range = 'all') {
  const records = await loadMlRecords()
  const selected = selectRecordsForRange(records, range)
  const summary = createReportSummary(selected, range)

  return resolvePayload({
    summary,
    types: reportTypes,
    dateRanges,
    exports: {
      csv: { available: true, message: 'CSV export is available for the selected dataset period.' },
      pdf: { available: false, message: 'PDF export is not implemented.' },
    },
  })
}

export async function requestReportExport(format, range = 'all', reportName = 'Dataset summary') {
  if (format !== 'csv') {
    throw new Error(`${format} export is not implemented.`)
  }

  const records = await loadMlRecords()
  const selected = selectRecordsForRange(records, range)
  const summary = createReportSummary(selected, range)
  const rows = [
    ['Report', 'ATM SENTINEL'],
    ['Report type', reportName],
    ['Generated at', summary.generatedAt.toISOString()],
    ['Data source', summary.dataSource],
    ['Source file', summary.sourcePath],
    ['Source provenance', summary.provenance],
    ['Dataset file', summary.resultsPath],
    ['Displayed location mode', summary.locationMode],
    ['Location assignment note', summary.locationNote],
    ['Operational context', summary.operationalContext],
    ['Anomaly interpretation', summary.anomalyCaveat],
    ['Currency and units', summary.currencyNote],
    ['Source date window', `${SYNTHETIC_MALAWI_DATASET.dateStart} to ${SYNTHETIC_MALAWI_DATASET.dateEnd}`],
    ['Period', summary.range],
    ['Earliest observation date', summary.dateRange.earliest ?? 'Unavailable'],
    ['Latest observation date', summary.dateRange.latest ?? 'Unavailable'],
    ['Earliest observation timestamp (Malawi local time)', summary.dateRange.earliestTimestamp ?? 'Unavailable'],
    ['Latest observation timestamp (Malawi local time)', summary.dateRange.latestTimestamp ?? 'Unavailable'],
    ['Metric', 'Value'],
    ['Transactions', summary.totalTransactions],
    ['Isolation Forest model-flagged anomalies', summary.totalAnomalies],
    ['MWK 100,000 threshold-rule flags (separate comparison)', summary.thresholdRuleFlags],
    ['Injected synthetic ground-truth labels (separate)', summary.groundTruthAnomalies],
    ['High-risk Isolation Forest anomalies', summary.highRiskAnomalies],
    ['Model anomaly rate (%)', summary.anomalyRate.toFixed(2)],
    ...reportSpecificRows(reportName, summary),
    [],
    ['Isolation Forest risk category', 'Transactions', 'Model-flagged anomalies'],
    ...Object.entries(summary.riskDistribution).map(([risk, count]) => [
      risk,
      count,
      summary.flaggedRiskDistribution[risk],
    ]),
    [],
    ['Date', 'Transactions', 'Model-flagged anomalies'],
    ...summary.dailySummaries.map((day) => [
      day.date,
      day.transactions,
      day.anomalies,
    ]),
    [],
    ['ATM ID', 'Synthetic ATM label', 'Simulated Malawi location', 'Transactions', 'Model-flagged anomalies', 'MWK threshold-rule flags (separate)', 'High model risk', 'Medium model risk', 'Low model risk', 'Model anomaly rate (%)'],
    ...summary.atmSummaries.map((atm) => [
      atm.atmId,
      atm.name,
      atm.location,
      atm.transactions,
      atm.anomalies,
      atm.thresholdRuleFlags,
      atm.high,
      atm.medium,
      atm.low,
      atm.anomalyRate.toFixed(2),
    ]),
    [],
    ['Model-flagged transaction ID', 'Timestamp', 'ATM ID', 'Synthetic ATM label', 'Simulated Malawi location', 'Transaction type', 'Amount (MWK)', 'Transaction status', 'Isolation Forest prediction', 'Isolation Forest anomaly score', 'Model risk level', 'MWK 100,000 threshold-rule flag (separate)', 'Injected synthetic ground-truth label (separate)', 'Model result explanation'],
    ...summary.anomalyRecords.map((record) => [
      record.id,
      record.timestamp,
      record.atmId,
      `Simulated ATM ${record.atmId}`,
      record.location,
      record.type,
      record.amount,
      record.transactionStatus,
      record.modelPrediction,
      record.modelAnomalyScore,
      record.risk,
      record.thresholdRuleFlagged ? 1 : 0,
      record.groundTruthAnomaly ? 1 : 0,
      record.anomalyReason,
    ]),
  ]
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
}

/** A concise, row-per-transaction export for the presentation prototype. */
export async function requestTransactionExport(range = 'all', anomaliesOnly = false) {
  const records = selectRecordsForRange(await loadMlRecords(), range)
    .filter((record) => !anomaliesOnly || record.isAnomaly)
  const rows = [
    ['Transaction ID', 'ATM ID', 'Transaction type', 'Amount (MWK)', 'Date / time', 'Transaction status', 'Isolation Forest prediction', 'Isolation Forest anomaly score', 'Model risk level', 'MWK 100,000 threshold-rule flag (separate)', 'Synthetic ground-truth label (separate)', 'Model result explanation'],
    ...records.map((record) => [
      record.transactionId,
      record.atmId,
      record.type,
      record.amount,
      record.timestamp,
      record.transactionStatus,
      record.modelPrediction,
      record.modelAnomalyScore,
      record.risk,
      record.thresholdRuleFlagged ? 1 : 0,
      record.groundTruthAnomaly ? 1 : 0,
      record.anomalyReason ?? '',
    ]),
  ]
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n')
}

export default { fetchReportOverview, requestReportExport, requestTransactionExport }
