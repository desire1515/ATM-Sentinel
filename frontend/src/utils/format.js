import { MALAWI_CONTEXT, formatMwkCurrency } from '../config/geography.js'

/**
 * Formatting helpers.
 * All values rendered by the dashboard pass through here so number, currency,
 * date and duration presentation stays consistent across every page.
 */

export function formatNumber(value, options = {}) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
    ...options,
  }).format(numeric)
}

export function formatCompactNumber(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'

  if (Math.abs(numeric) < 1000) return formatNumber(numeric)

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(numeric)
}

export function formatCurrency(value, { currency, locale = 'en-US', decimals = 2, compact = false } = {}) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || !currency) return '—'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact && Math.abs(numeric) >= 10000 ? 'compact' : 'standard',
    minimumFractionDigits: compact && Math.abs(numeric) >= 10000 ? 1 : decimals,
    maximumFractionDigits: compact && Math.abs(numeric) >= 10000 ? 1 : decimals,
  }).format(numeric)
}

export function formatPercent(value, { decimals = 1, withSign = false } = {}) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'

  const sign = withSign && numeric > 0 ? '+' : ''
  return `${sign}${numeric.toFixed(decimals)}%`
}

export function formatScore(value, decimals = 3) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return numeric.toFixed(decimals)
}

export function formatDate(input, options = {}) {
  const date = toDate(input)
  if (!date) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export function formatTime(input, { withSeconds = false, timeZone } = {}) {
  const date = toDate(input)
  if (!date) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}

export function formatDateTime(input, { timeZone } = {}) {
  const date = toDate(input)
  if (!date) return '—'
  return `${formatDate(date, timeZone ? { timeZone } : {})} · ${formatTime(date, { timeZone })}`
}

export function formatMalawiDateTime(input) {
  return formatDateTime(input, { timeZone: MALAWI_CONTEXT.timeZone })
}

export { formatMwkCurrency }

export function formatRelativeTime(input, now = new Date()) {
  const date = toDate(input)
  if (!date) return '—'

  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.round(diffMs / 60000)

  if (Math.abs(minutes) < 1) return 'just now'
  if (Math.abs(minutes) < 60) return minutes > 0 ? `${minutes}m ago` : `in ${Math.abs(minutes)}m`

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return hours > 0 ? `${hours}h ago` : `in ${Math.abs(hours)}h`

  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return days > 0 ? `${days}d ago` : `in ${Math.abs(days)}d`

  return formatDate(date)
}

/** Mask identifiers so no real-looking account data is ever displayed. */
export function maskId(value, visible = 4) {
  const text = String(value ?? '')
  if (text.length <= visible) return text
  return `•••• ${text.slice(-visible)}`
}

/** Sentence-case a kebab/snake value: "high-risk" -> "High risk" */
export function humanize(value) {
  const text = String(value ?? '').replace(/[-_]+/g, ' ').trim()
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function toDate(input) {
  if (input === null || input === undefined || input === '') return null
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input
  if (typeof input === 'number') {
    const fromNumber = new Date(input)
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber
  }
  if (typeof input === 'string') {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
    if (dateOnly) {
      const [, year, month, day] = dateOnly
      const fromDateOnly = new Date(Number(year), Number(month) - 1, Number(day))
      if (
        fromDateOnly.getFullYear() !== Number(year) ||
        fromDateOnly.getMonth() !== Number(month) - 1 ||
        fromDateOnly.getDate() !== Number(day)
      ) {
        return null
      }
      return Number.isNaN(fromDateOnly.getTime()) ? null : fromDateOnly
    }

    const localDateTime =
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
        input,
      )
    if (localDateTime) {
      const [, year, month, day, hour, minute, second = '0', millisecond = '0'] = localDateTime
      const fromDateTime = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        Number(millisecond.padEnd(3, '0')),
      )
      if (
        fromDateTime.getFullYear() !== Number(year) ||
        fromDateTime.getMonth() !== Number(month) - 1 ||
        fromDateTime.getDate() !== Number(day) ||
        fromDateTime.getHours() !== Number(hour) ||
        fromDateTime.getMinutes() !== Number(minute) ||
        fromDateTime.getSeconds() !== Number(second)
      ) {
        return null
      }
      return fromDateTime
    }

    const fromString = new Date(input)
    return Number.isNaN(fromString.getTime()) ? null : fromString
  }
  return null
}

export function datasetDayKey(input) {
  if (typeof input === 'string') {
    const timestamp = /^(\d{4}-\d{2}-\d{2})(?:[T ]|$)/.exec(input)
    if (timestamp) return timestamp[1]
  }

  const date = toDate(input)
  if (!date) return null

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
