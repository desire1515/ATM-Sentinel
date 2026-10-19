import { resolvePayload } from './apiClient.js'
import { loadMlRecords } from './mlDataAdapter.js'
import {
  filterTransactions,
  sortRecordsByToken,
  summarizeRecords,
  TIMEFRAMES,
} from '../utils/filters.js'

export async function fetchTransactions() {
  const records = await loadMlRecords()

  return resolvePayload({
    records,
    summary: summarizeRecords(records),
    timeframeOptions: TIMEFRAMES,
  })
}

export async function fetchTransactionById(id) {
  const records = await loadMlRecords()
  return resolvePayload(records.find((record) => record.id === id) ?? null)
}

export async function fetchTransactionsByAtm(atmId) {
  const records = await loadMlRecords()
  return resolvePayload(records.filter((record) => record.atmId === atmId))
}

export function queryTransactions(records, { filters = {}, sort = 'timestamp-desc' } = {}) {
  const filtered = filterTransactions(records, filters)
  const sorted = sortRecordsByToken(filtered, sort)

  return {
    records: sorted,
    totals: summarizeRecords(sorted),
  }
}

export default { fetchTransactions, fetchTransactionById, fetchTransactionsByAtm, queryTransactions }
