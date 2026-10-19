export const MALAWI_CONTEXT = Object.freeze({
  country: 'Malawi',
  countryCode: 'MW',
  currency: 'MWK',
  timeZone: 'Africa/Blantyre',
  mode: 'Synthetic Malawi ATM transaction demonstration',
})

export const SYNTHETIC_MALAWI_DATASET = Object.freeze({
  id: 'malawi-synthetic-atm-transactions',
  label: 'Synthetic Malawi ATM transactions',
  city: 'Malawi',
  country: 'Malawi',
  countryCode: 'MW',
  dateStart: '2025-01-01',
  dateEnd: '2025-12-31',
  recordCount: 50_000,
  atmCount: 100,
  sourcePath: '/data/malawi_anomaly_results.csv',
  rawSourcePath: 'dataset/atm_transactions_malawi_synthetic.csv',
  provenance:
    'Synthetic transaction-level demonstration data generated for ATM Sentinel; not connected to a real bank.',
  currency: 'MWK',
  currencyNote:
    'Amounts are simulated Malawi Kwacha values and do not represent real banking activity.',
  locationNote:
    'ATM coordinates and locations are simulated and do not identify verified ATM installations.',
  anomalyNote:
    'Isolation Forest predictions, separate threshold-rule flags and injected synthetic labels are distinct; none establishes actual fraud.',
})

export function formatSyntheticMalawiLocation(city, location) {
  return [city, location].filter(Boolean).join(' · ')
}

export function formatMwkCurrency(value, options = {}) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: MALAWI_CONTEXT.currency,
    currencyDisplay: 'code',
    ...options,
  }).format(numeric)
}
