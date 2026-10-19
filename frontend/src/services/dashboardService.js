import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import { APP_META } from '../utils/constants.js'
import { datasetDayKey } from '../utils/format.js'

function buildDayKey(timestamp) {
  return datasetDayKey(timestamp)
}

export async function fetchDashboardOverview() {
  const records = await loadMlRecords()
  const anomalies = records.filter((record) => record.isAnomaly)
  const riskCounts = { High: 0, Medium: 0, Low: 0 }
  const byDay = new Map()
  const byHour = new Map()
  const byAtm = new Set()

  records.forEach((record) => {
    byAtm.add(record.atmId)
    const day = buildDayKey(record.timestamp)
    const dayBucket = byDay.get(day) ?? { observations: 0, anomalies: 0 }
    dayBucket.observations += 1
    if (record.isAnomaly) dayBucket.anomalies += 1
    byDay.set(day, dayBucket)

    const hour = Number(record.hour)
    const hourBucket = byHour.get(hour) ?? 0
    byHour.set(hour, hourBucket + (record.isAnomaly ? 1 : 0))

    if (record.isAnomaly && record.risk in riskCounts) {
      riskCounts[record.risk] += 1
    }
  })

  const activitySeries = [...byDay.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, totals]) => ({
      day,
      label: day,
      ...totals,
    }))
  const anomalyTrend = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    anomalies: byHour.get(hour) ?? 0,
  }))
  const anomalyCount = anomalies.length
  const anomalyRate = records.length ? (anomalyCount / records.length) * 100 : 0
  const highRiskCount = riskCounts.High
  const alerts = [...anomalies]
    .sort((left, right) => {
      const recentFirst =
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
      return recentFirst || right.anomalyScore - left.anomalyScore
    })
    .slice(0, 8)
    .map((record) => ({
      id: record.id,
      transactionId: record.transactionId,
      atmId: record.atmId,
      anomalyScore: record.anomalyScore,
      amount: record.amount,
      risk: record.risk,
      status: record.detectionStatus,
      timestamp: record.timestamp,
      type: record.type,
    }))

  return resolvePayload({
    summary: {
      totalTransactions: records.length,
      normalObservations: records.length - anomalyCount,
      anomaliesDetected: anomalyCount,
      highRiskAnomalies: highRiskCount,
      monitoredAtms: byAtm.size,
      anomalyRate,
      windowLabel: 'Synthetic dataset window',
    },
    kpis: [
      {
        id: 'total',
        label: 'Transactions',
        value: records.length,
        icon: 'Activity',
        tone: 'brand',
        hint: 'Synthetic individual transaction records in the dataset.',
      },
      {
        id: 'normal',
        label: 'Normal transactions',
        value: records.length - anomalyCount,
        icon: 'CheckCircle2',
        tone: 'ok',
        hint: 'Transactions classified as normal by the precomputed Isolation Forest model.',
      },
      {
        id: 'anomalies',
        label: 'Flagged for review',
        value: anomalyCount,
        icon: 'TriangleAlert',
        tone: 'warn',
        hint: 'Transactions flagged as anomalous by the precomputed Isolation Forest model.',
      },
      {
        id: 'withdrawal-total',
        label: 'Total withdrawal amount',
        value: records.filter((record) => record.type === 'Cash withdrawal').reduce((sum, record) => sum + record.amount, 0),
        icon: 'ShieldAlert',
        tone: 'risk',
        hint: 'Total value of cash withdrawals in this demonstration sample.',
      },
    ],
    distribution: [
      { key: 'normal', label: 'Normal', value: records.length - anomalyCount },
      { key: 'anomalous', label: 'Anomalous', value: anomalyCount },
    ],
    riskBreakdown: [
      { key: 'high', label: 'High risk', value: riskCounts.High },
      { key: 'medium', label: 'Medium risk', value: riskCounts.Medium },
      { key: 'low', label: 'Low risk', value: riskCounts.Low },
    ],
    activitySeries,
    anomalyTrend,
    alerts,
    notifications: alerts.map((alert) => ({
      id: alert.id,
      title: `${alert.risk} review flag`,
      body: `${alert.transactionId} · ${alert.atmId}`,
      timestamp: alert.timestamp,
      tone: alert.risk === 'High' ? 'risk' : alert.risk === 'Medium' ? 'warn' : 'ok',
      href: `/anomalies/${alert.id}`,
    })),
    systemStatus: {
      modelStatus: 'Precomputed Isolation Forest results loaded',
      version: APP_META.version,
      lastSync: null,
    },
    anomalySummary: { anomalyRate },
  })
}

export default { fetchDashboardOverview }
