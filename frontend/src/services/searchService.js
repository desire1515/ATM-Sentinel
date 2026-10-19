import { loadMlRecords } from './mlDataAdapter.js'
import { SEARCH_RESULT_LIMIT } from '../utils/constants.js'

export async function searchMlData(query, { limit = SEARCH_RESULT_LIMIT } = {}) {
  const needle = String(query ?? '').trim().toLowerCase()

  if (needle.length < 2) {
    return { transactions: [], atms: [], anomalies: [], isEmpty: true }
  }

  const records = await loadMlRecords()
  const matches = (...fields) =>
    fields.filter(Boolean).some((field) => String(field).toLowerCase().includes(needle))

  const transactions = records
    .filter((record) => matches(record.id, record.atmId, record.type))
    .slice(0, limit)
    .map((record) => ({
      id: record.id,
      label: record.id,
      meta: `${record.type} · ${record.atmId}`,
      risk: record.risk,
      to: `/transactions?txn=${encodeURIComponent(record.id)}`,
    }))

  const atmRecords = new Map()
  records.forEach((record) => {
    if (!atmRecords.has(record.atmId)) atmRecords.set(record.atmId, record)
  })
  const atms = [...atmRecords.values()]
    .filter((record) => matches(record.atmId, record.location))
    .slice(0, limit)
    .map((record) => ({
      id: record.atmId,
      label: `ATM ${record.atmId}`,
      meta: `${record.atmId} · ${record.location}`,
      to: `/atm-network?atm=${encodeURIComponent(record.atmId)}`,
    }))

  const anomalies = records
    .filter((record) => record.isAnomaly && matches(record.id, record.transactionId, record.atmId))
    .slice(0, limit)
    .map((record) => ({
      id: record.id,
      label: record.id,
      meta: `${record.atmId} · ${record.type}`,
      risk: record.risk,
      to: `/anomalies/${encodeURIComponent(record.id)}`,
    }))

  return {
    transactions,
    atms,
    anomalies,
    isEmpty: !transactions.length && !atms.length && !anomalies.length,
  }
}

export default { searchMlData }
