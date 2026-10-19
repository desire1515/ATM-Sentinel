import { Minus, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'
import { getRiskMeta } from '../../utils/risk'
import { Badge } from './Badge'

const RISK_ICONS = {
  normal: ShieldCheck,
  high: ShieldAlert,
  medium: TriangleAlert,
  low: ShieldCheck,
}

/**
 * Risk level chip (Low / Medium / High).
 * Always renders an icon next to the label so the level is not conveyed by
 * colour alone.
 */
export function RiskBadge({ risk = 'low', size = 'md', showIcon = true, className }) {
  const meta = getRiskMeta(risk)
  const Icon = showIcon ? (RISK_ICONS[meta.level] ?? Minus) : null

  return (
    <Badge tone={meta.tone} size={size} icon={Icon} className={className}>
      {meta.label}
    </Badge>
  )
}

export default RiskBadge
