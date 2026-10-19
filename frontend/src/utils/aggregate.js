import { toDate } from './format.js'

/**
 * Small, dependency-free aggregation helpers shared by the analytics, ATM and
 * dashboard data builders. Keeping them here avoids repeating reduce blocks in
 * every data file and keeps those files declarative.
 */

export function groupBy(records, keyFn) {
  const groups = new Map()

  for (const record of records) {
    const key = keyFn(record)
    if (key == null) continue
    const bucket = groups.get(key)
    if (bucket) bucket.push(record)
    else groups.set(key, [record])
  }

  return groups
}

export function countBy(records, keyFn) {
  const counts = {}

  for (const record of records) {
    const key = keyFn(record)
    if (key == null) continue
    counts[key] = (counts[key] ?? 0) + 1
  }

  return counts
}

export function sumBy(records, valueFn) {
  return records.reduce((total, record) => total + (Number(valueFn(record)) || 0), 0)
}

export function averageBy(records, valueFn) {
  if (!records.length) return 0
  return sumBy(records, valueFn) / records.length
}

export function medianBy(records, valueFn) {
  if (!records.length) return 0
  const sorted = records.map((record) => Number(valueFn(record)) || 0).sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}

export function sortRecords(records, keyFn, direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1

  return [...records].sort((a, b) => {
    const left = keyFn(a)
    const right = keyFn(b)

    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor
    }

    return String(left ?? '').localeCompare(String(right ?? '')) * factor
  })
}

/** Stable YYYY-MM-DD key in local time (used for time-series grouping). */
export function dayKey(input) {
  const date = toDate(input)
  if (!date) return null
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function shortDayLabel(input) {
  const date = toDate(input)
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date)
}

/**
 * Bucket numeric records into labelled ranges.
 * @param {Array} records
 * @param {(record: any) => number} valueFn
 * @param {Array<{label: string, min: number, max: number}>} ranges
 * @param {(record: any) => string} [seriesFn] optional series split
 */
export function bucketize(records, valueFn, ranges, seriesFn) {
  const result = ranges.map((range) => ({
    label: range.label,
    min: range.min,
    max: range.max,
    count: 0,
    series: seriesFn ? {} : undefined,
  }))

  for (const record of records) {
    const value = Number(valueFn(record))
    if (!Number.isFinite(value)) continue

    const bucket = result.find((entry) => value >= entry.min && value < entry.max)
    if (!bucket) continue

    bucket.count += 1

    if (seriesFn) {
      const series = seriesFn(record)
      bucket.series[series] = (bucket.series[series] ?? 0) + 1
    }
  }

  return result.map(({ label, count, series }) => ({ label, count, ...(series ?? {}) }))
}
