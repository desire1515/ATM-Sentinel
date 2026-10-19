import {
  CircleCheck,
  CircleDashed,
  CircleSlash,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react'
import {
  ATM_STATUS_META,
  DETECTION_STATUS_META,
  TRANSACTION_STATUS_META,
  getStatusMeta,
} from '../../utils/risk'
import { Badge } from './Badge'

const MAPS = {
  transaction: TRANSACTION_STATUS_META,
  anomaly: DETECTION_STATUS_META,
  atm: ATM_STATUS_META,
}

/** Icon per tone so status is communicated by shape as well as colour. */
const TONE_ICONS = {
  ok: CircleCheck,
  warn: TriangleAlert,
  risk: CircleSlash,
  brand: RotateCcw,
  dim: CircleDashed,
}

/**
 * Status chip for transactions, anomalies and ATM health.
 * Anomaly statuses intentionally use "flagged as anomalous" wording rather than
 * asserting fraud — the system performs unsupervised anomaly detection.
 */
export function StatusBadge({ status, map = 'transaction', size = 'md', className }) {
  const meta = getStatusMeta(MAPS[map] ?? TRANSACTION_STATUS_META, status)
  const Icon = TONE_ICONS[meta.tone] ?? CircleDashed

  return (
    <Badge tone={meta.tone} size={size} icon={Icon} className={className}>
      {meta.label}
    </Badge>
  )
}

export default StatusBadge
