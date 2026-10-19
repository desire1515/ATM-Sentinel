/**
 * Shared data-service helpers for the CSV-backed frontend.
 */
import { SYNTHETIC_MALAWI_DATASET } from '../config/geography.js'

export const DATA_SOURCE = {
  mode: 'csv',
  id: SYNTHETIC_MALAWI_DATASET.id,
  label: SYNTHETIC_MALAWI_DATASET.label,
  detail: `${SYNTHETIC_MALAWI_DATASET.provenance} Raw source: ${SYNTHETIC_MALAWI_DATASET.rawSourcePath}; frontend demonstration dataset: ${SYNTHETIC_MALAWI_DATASET.sourcePath}.`,
  country: SYNTHETIC_MALAWI_DATASET.country,
  dateStart: SYNTHETIC_MALAWI_DATASET.dateStart,
  dateEnd: SYNTHETIC_MALAWI_DATASET.dateEnd,
}

export class DataServiceError extends Error {
  constructor(message, { code = 'DATA_SERVICE_ERROR', detail = null } = {}) {
    super(message)
    this.name = 'DataServiceError'
    this.code = code
    this.detail = detail
  }
}

export function resolvePayload(payload) {
  return Promise.resolve(payload)
}

export function withServiceError(payloadFactory) {
  try {
    return resolvePayload(payloadFactory())
  } catch (error) {
    return Promise.reject(
      new DataServiceError('Unable to load dataset records.', {
        detail: error instanceof Error ? error.message : String(error),
      }),
    )
  }
}
