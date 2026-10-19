import { DataServiceError } from './apiClient.js'
import { toDate } from '../utils/format.js'
import {
  formatSyntheticMalawiLocation,
  SYNTHETIC_MALAWI_DATASET,
} from '../config/geography.js'
import {
  DEMONSTRATION_WITHDRAWAL_THRESHOLD,
  isDemonstrationFlaggedTransaction,
} from '../utils/demonstrationRule.js'

const CSV_PATH = SYNTHETIC_MALAWI_DATASET.sourcePath
export { DEMONSTRATION_WITHDRAWAL_THRESHOLD }

const NUMERIC_FIELDS = [
  'atm_latitude',
  'atm_longitude',
  'transaction_hour',
  'is_weekend',
  'transaction_amount_mwk',
  'transaction_amount',
  'balance_after_mwk',
  'is_anomaly',
  'ground_truth_anomaly',
  'model_prediction',
  'model_anomaly_score',
]

const REQUIRED_HEADERS = [
  'transaction_id',
  'atm_id',
  'city',
  'location',
  'atm_latitude',
  'atm_longitude',
  'transaction_datetime',
  'transaction_date',
  'transaction_hour',
  'day_of_week',
  'is_weekend',
  'transaction_type',
  'transaction_amount_mwk',
  'transaction_amount',
  'currency',
  'account_id',
  'transaction_status',
  'balance_after_mwk',
  'is_anomaly',
  'ground_truth_anomaly',
  'anomaly_type',
  'data_source',
  'is_live_bank_data',
  'model_prediction',
  'model_anomaly_score',
  'model_is_anomaly',
  'model_risk_level',
]

const SOURCE_MODEL_FIELDS = new Set([
  'model_prediction',
  'model_anomaly_score',
  'model_is_anomaly',
  'model_risk_level',
])

function parseCsv(text) {
  const rows = []
  let row = []
  let value = ''
  let insideQuotes = false
  const source = text.replace(/^\uFEFF/, '')

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]

    if (character === '"') {
      if (insideQuotes && source[index + 1] === '"') {
        value += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (character === ',' && !insideQuotes) {
      row.push(value)
      value = ''
    } else if ((character === '\r' || character === '\n') && !insideQuotes) {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      row.push(value)
      value = ''

      if (row.some((field) => field !== '')) rows.push(row)
      row = []
    } else {
      value += character
    }
  }

  if (insideQuotes) {
    throw new DataServiceError('The synthetic demonstration CSV is malformed.', {
      code: 'INVALID_DATASET',
      detail: 'A quoted field is not closed.',
    })
  }

  if (value !== '' || row.length > 0) {
    row.push(value)
    if (row.some((field) => field !== '')) rows.push(row)
  }

  if (!rows.length) {
    throw new DataServiceError('The synthetic demonstration CSV is empty.', {
      code: 'INVALID_DATASET',
    })
  }

  const headers = rows.shift()
  if (headers.some((header) => !header.trim()) || new Set(headers).size !== headers.length) {
    throw new DataServiceError('The synthetic demonstration CSV has invalid headers.', {
      code: 'INVALID_DATASET',
    })
  }

  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header))
  if (missingHeaders.length) {
    throw new DataServiceError('The synthetic demonstration CSV is missing required fields.', {
      code: 'INVALID_DATASET',
      detail: missingHeaders.join(', '),
    })
  }

  return rows.map((values, index) => {
    if (values.length !== headers.length) {
      throw new DataServiceError('The synthetic demonstration CSV contains a malformed record.', {
        code: 'INVALID_DATASET',
        detail: `Record ${index + 2} has ${values.length} fields; expected ${headers.length}.`,
      })
    }

    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? ''
      return record
    }, {})
  })
}

function convertValue(field, value, recordNumber) {
  if (NUMERIC_FIELDS.includes(field)) {
    const parsed = Number(value)
    if (!value.trim() || !Number.isFinite(parsed)) {
      throw new DataServiceError('The synthetic demonstration CSV contains an invalid number.', {
        code: 'INVALID_DATASET',
        detail: `Record ${recordNumber + 2}, field "${field}" is not numeric.`,
      })
    }
    return parsed
  }

  if (field === 'model_is_anomaly') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
    throw new DataServiceError('The Malawi model results CSV contains an invalid prediction flag.', {
      code: 'INVALID_DATASET',
      detail: `Record ${recordNumber + 2}, field "${field}" must be true or false.`,
    })
  }

  return value
}

function normalizeRawRecord(record, index) {
  const normalized = Object.entries(record).reduce((result, [field, value]) => {
    result[field] = convertValue(field, value, index)
    return result
  }, {})

  const timestamp = normalized.transaction_datetime
  if (!toDate(timestamp)) {
    throw new DataServiceError('The Malawi model results CSV contains an invalid timestamp.', {
      code: 'INVALID_DATASET',
      detail: `Record ${index + 2}, field "transaction_datetime" is not a valid date.`,
    })
  }

  if (
    ![-1, 1].includes(normalized.model_prediction) ||
    (normalized.model_prediction === -1) !== normalized.model_is_anomaly
  ) {
    throw new DataServiceError('The source CSV detection fields disagree.', {
      code: 'INVALID_DATASET',
      detail: `Record ${index + 2} has inconsistent source-provided prediction metadata.`,
    })
  }

  if (
    !['Normal', 'Low', 'Medium', 'High'].includes(normalized.model_risk_level) ||
    normalized.currency !== 'MWK' ||
    normalized.data_source !== 'SYNTHETIC_MALAWI_DEMONSTRATION' ||
    normalized.is_live_bank_data.toLowerCase() !== 'false' ||
    !['0', '1'].includes(String(normalized.ground_truth_anomaly)) ||
    String(normalized.is_anomaly) !== String(normalized.ground_truth_anomaly)
  ) {
    throw new DataServiceError('The Malawi source records contain invalid provenance or labels.', {
      code: 'INVALID_DATASET',
      detail: `Record ${index + 2} has invalid currency, source, ground-truth or risk values.`,
    })
  }

  const transactionType = {
    WITHDRAWAL: 'Cash withdrawal',
    DEPOSIT: 'Deposit',
    BALANCE_INQUIRY: 'Balance inquiry',
    TRANSFER: 'Transfer',
    CARDLESS_WITHDRAWAL: 'Cardless withdrawal',
  }[normalized.transaction_type] ?? normalized.transaction_type
  const transactionStatus = {
    SUCCESS: 'Completed',
    FAILED: 'Failed',
    DECLINED: 'Declined',
  }[normalized.transaction_status] ?? normalized.transaction_status
  const location = formatSyntheticMalawiLocation(normalized.city, normalized.location)
  const isDeposit = normalized.transaction_type === 'DEPOSIT'
  const isOutgoing = ['WITHDRAWAL', 'CARDLESS_WITHDRAWAL', 'TRANSFER'].includes(
    normalized.transaction_type,
  )
  const successful = normalized.transaction_status === 'SUCCESS'
  const thresholdRuleFlagged = isDemonstrationFlaggedTransaction({
    type: transactionType,
    amount: normalized.transaction_amount_mwk,
  })
  const isAnomaly = normalized.model_is_anomaly
  const sourceFields = Object.fromEntries(
    Object.entries(normalized).filter(([field]) => !SOURCE_MODEL_FIELDS.has(field)),
  )

  return {
    ...sourceFields,
    dataSourceId: SYNTHETIC_MALAWI_DATASET.id,
    geography: {
      city: normalized.city,
      country: SYNTHETIC_MALAWI_DATASET.country,
      countryCode: SYNTHETIC_MALAWI_DATASET.countryCode,
    },
    sourceLocation: location,
    sourceBranch: normalized.location,
    locationStatus: 'Simulated location and coordinates; not a verified ATM installation.',
    id: normalized.transaction_id,
    transactionId: normalized.transaction_id,
    atmId: normalized.atm_id,
    atmCity: normalized.city,
    atmAddress: normalized.location,
    branch: normalized.location,
    location,
    atmLatitude: normalized.atm_latitude,
    atmLongitude: normalized.atm_longitude,
    amount: normalized.transaction_amount_mwk,
    type: transactionType,
    transactionStatus,
    status: transactionStatus,
    modelPrediction: isAnomaly ? 'Anomaly' : 'Normal',
    modelIsAnomaly: isAnomaly,
    modelAnomalyScore: normalized.model_anomaly_score,
    modelRiskLevel: normalized.model_risk_level,
    thresholdRuleFlagged,
    detectionStatus: isAnomaly ? 'Flagged for Review' : 'Cleared',
    anomalyScore: normalized.model_anomaly_score,
    risk: normalized.model_risk_level,
    isAnomaly,
    anomalyReason: isAnomaly
      ? `Isolation Forest flagged this transaction (anomaly score ${normalized.model_anomaly_score.toFixed(6)}).`
      : 'Isolation Forest classified this transaction as normal.',
    groundTruthAnomaly: normalized.ground_truth_anomaly === 1,
    anomalyType: normalized.anomaly_type,
    transactionCount: 1,
    totalNumberTransaction: 1,
    numberIncomeTransaction: Number(isDeposit),
    numberOutcomeTransaction: Number(isOutgoing),
    totalIncome: successful && isDeposit ? normalized.transaction_amount_mwk : 0,
    totalOutcome: successful && isOutgoing ? normalized.transaction_amount_mwk : 0,
    balanceAfter: normalized.balance_after_mwk,
    totalBalance: normalized.balance_after_mwk,
    hour: normalized.transaction_hour,
    transactionTime: timestamp,
    timestamp,
  }
}

let cachedRecords = null
let loadingPromise = null
const datasetStatusListeners = new Set()
let datasetStatus = {
  state: 'not-verified',
  count: null,
  error: null,
  lastSuccessfulAt: null,
}

function publishDatasetStatus(nextStatus) {
  datasetStatus = nextStatus
  datasetStatusListeners.forEach((listener) => listener(datasetStatus))
}

export function getMlDatasetStatus() {
  return datasetStatus
}

export function subscribeMlDatasetStatus(listener) {
  datasetStatusListeners.add(listener)
  return () => datasetStatusListeners.delete(listener)
}

export async function loadMlRecords() {
  if (cachedRecords) {
    return cachedRecords
  }

  if (loadingPromise) {
    return loadingPromise
  }

  publishDatasetStatus({
    ...datasetStatus,
    state: 'loading',
    count: null,
    error: null,
  })

  loadingPromise = fetch(CSV_PATH, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Unable to load the synthetic demonstration dataset: ${response.status} ${response.statusText}`,
        )
      }

      return response.text()
    })
    .then((text) => {
      const records = parseCsv(text)
        .map(normalizeRawRecord)
        .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

      cachedRecords = records
      publishDatasetStatus({
        state: 'success',
        count: records.length,
        error: null,
        lastSuccessfulAt: new Date(),
      })
      return records
    })
    .catch((error) => {
      publishDatasetStatus({
        state: 'error',
        count: null,
        error: error instanceof Error ? error.message : 'Dataset could not be loaded.',
        lastSuccessfulAt: datasetStatus.lastSuccessfulAt,
      })
      throw error
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

export function clearMlRecordCache() {
  cachedRecords = null
}

export async function refreshMlRecords() {
  clearMlRecordCache()
  return loadMlRecords()
}

export default {
  loadMlRecords,
  clearMlRecordCache,
  refreshMlRecords,
}
