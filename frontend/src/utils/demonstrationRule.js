export const DEMONSTRATION_WITHDRAWAL_THRESHOLD = 100000
export const DEMONSTRATION_RULE_RESULT_NORMAL = 0
export const DEMONSTRATION_RULE_RESULT_FLAGGED = 1

function normalizeTransactionType(type) {
  return String(type ?? '').trim()
}

function toFiniteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function isDemonstrationFlaggedTransaction(recordLike) {
  const type = normalizeTransactionType(recordLike?.type ?? recordLike?.transaction_type)
  const amount = toFiniteNumber(recordLike?.amount ?? recordLike?.transaction_amount_mwk ?? recordLike?.transaction_amount)

  if (!type || amount === null) {
    return false
  }

  const matchesWithdrawal = type === 'Cash withdrawal' || type === 'WITHDRAWAL'
  return matchesWithdrawal && amount >= DEMONSTRATION_WITHDRAWAL_THRESHOLD
}

export function getDemonstrationRuleResult(recordLike) {
  return isDemonstrationFlaggedTransaction(recordLike)
    ? DEMONSTRATION_RULE_RESULT_FLAGGED
    : DEMONSTRATION_RULE_RESULT_NORMAL
}

export function getDemonstrationRisk(recordLike) {
  return isDemonstrationFlaggedTransaction(recordLike) ? 'High' : 'Normal'
}
