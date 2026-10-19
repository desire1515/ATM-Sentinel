import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import { filterAtms } from '../utils/filters.js'
import { round } from '../utils/random.js'

function groupByAtm(records) {
  const groups = new Map()

  records.forEach((record) => {
    const group = groups.get(record.atmId) ?? {
      id: record.atmId,
      name: `Simulated ATM ${record.atmId}`,
      branch: record.branch,
      city: record.atmCity,
      location: record.location,
      latitude: record.atmLatitude,
      longitude: record.atmLongitude,
      locationStatus: record.locationStatus,
      observations: 0,
      anomalies: 0,
      transactionCount: 0,
      high: 0,
      medium: 0,
      low: 0,
      timestamps: [],
    }

    group.observations += 1
    group.transactionCount += Number(record.transactionCount) || 0
    if (record.isAnomaly) {
      group.anomalies += 1
      if (record.risk === 'High') group.high += 1
      else if (record.risk === 'Medium') group.medium += 1
      else if (record.risk === 'Low') group.low += 1
    }
    if (record.timestamp) group.timestamps.push(new Date(record.timestamp).getTime())
    groups.set(record.atmId, group)
  })

  return [...groups.values()].map((group) => {
    const highestRisk = group.high ? 'High' : group.medium ? 'Medium' : group.low ? 'Low' : 'Normal'
    const latest = Math.max(...group.timestamps)

    return {
      ...group,
      risk: highestRisk,
      transactionCount: group.observations,
      anomalyCount: group.anomalies,
      anomalyRate: group.observations ? round((group.anomalies / group.observations) * 100, 2) : 0,
      latestActivity: Number.isFinite(latest) ? new Date(latest).toISOString() : null,
      lastActivity: Number.isFinite(latest) ? new Date(latest).toISOString() : null,
    }
  })
}

function buildAtmSummary(records, atms) {
  const anomalies = records.filter((record) => record.isAnomaly).length
  return {
    total: atms.length,
    totalAtms: atms.length,
    totalTransactions: records.length,
    totalAnomalies: anomalies,
    highRisk: atms.filter((atm) => atm.risk === 'High').length,
    averageAnomalyRate: atms.length
      ? atms.reduce((total, atm) => total + atm.anomalyRate, 0) / atms.length
      : 0,
  }
}

function positionAtms(atms) {
  const longitudes = atms.map((atm) => Number(atm.longitude))
  const latitudes = atms.map((atm) => Number(atm.latitude))
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const longitudeSpan = maxLongitude - minLongitude || 1
  const latitudeSpan = maxLatitude - minLatitude || 1

  return atms.map((atm) => ({
    ...atm,
    node: {
      x: 8 + ((atm.longitude - minLongitude) / longitudeSpan) * 84,
      y: 8 + ((maxLatitude - atm.latitude) / latitudeSpan) * 84,
    },
  }))
}

export async function fetchAtms() {
  const records = await loadMlRecords()
  const atms = positionAtms(groupByAtm(records))

  return resolvePayload({ records: atms, summary: buildAtmSummary(records, atms) })
}

export async function fetchAtmById(id) {
  const records = await loadMlRecords()
  const atm = groupByAtm(records).find((entry) => entry.id === id) ?? null
  return resolvePayload(atm)
}

export function queryAtms(records, filters = {}) {
  return filterAtms([...records], filters)
}

export default { fetchAtms, fetchAtmById, queryAtms }
