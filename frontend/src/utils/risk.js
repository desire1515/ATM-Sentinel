import { humanize } from './format'

/**
 * Model risk tiers and status presentation.
 */

export const RISK_META = {
  normal: {
    level: 'normal',
    label: 'Normal',
    description: 'The model classified the transaction as normal.',
    tone: 'ok',
    className: 'border-ok/40 bg-ok/10 text-ok',
  },
  high: {
    level: 'high',
    label: 'High',
    description: 'Highest model risk band among this synthetic dataset.',
    tone: 'risk',
    className: 'border-risk/40 bg-risk/10 text-risk',
  },
  medium: {
    level: 'medium',
    label: 'Medium',
    description: 'Medium model risk band; not a fraud determination.',
    tone: 'warn',
    className: 'border-warn/40 bg-warn/10 text-warn',
  },
  low: {
    level: 'low',
    label: 'Low',
    description: 'Lower model risk band; this is not a fraud determination.',
    tone: 'ok',
    className: 'border-ok/40 bg-ok/10 text-ok',
  },
}

/** Resolve presentation metadata for a risk level supplied by the dataset. */
export function getRiskMeta(level) {
  return RISK_META[String(level ?? '').toLowerCase()] ?? RISK_META.low
}

export const DETECTION_STATUS_META = {
  'Flagged for Review': { label: 'Flagged for Review', tone: 'warn' },
  Flagged: { label: 'Flagged for Review', tone: 'warn' },
  'Under Review': { label: 'Review pending', tone: 'warn' },
  Cleared: { label: 'Not flagged for review', tone: 'ok' },
}

export const TRANSACTION_STATUS_META = {
  Completed: { label: 'Completed', tone: 'ok' },
  Failed: { label: 'Failed', tone: 'warn' },
  Declined: { label: 'Declined', tone: 'risk' },
}

export const ATM_STATUS_META = {
  active: { label: 'Active', tone: 'ok' },
  warning: { label: 'Warning', tone: 'warn' },
  'high-risk': { label: 'High Risk', tone: 'risk' },
  offline: { label: 'Offline', tone: 'dim' },
}

export function getStatusMeta(map, key, fallbackLabel) {
  return (
    map[key] ?? {
      label: fallbackLabel ?? humanize(key),
      tone: 'dim',
    }
  )
}
