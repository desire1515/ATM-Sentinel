import { TriangleAlert } from 'lucide-react'
import RiskBadge from '../common/RiskBadge'
import StatusBadge from '../common/StatusBadge'
import ScoreBar from '../common/ScoreBar'
import { Button } from '../common/Button'
import { formatDateTime, formatMwkCurrency, formatNumber } from '../../utils/format'

export function DetailRow({ label, value, className }) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</dt>
      <dd className="mt-1 break-words text-sm text-body">{value}</dd>
    </div>
  )
}

export function TransactionDetails({ transaction, anomaly, onViewAnomaly }) {
  if (!transaction) return null

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          Synthetic transaction
        </h3>

        <dl className="mt-3 grid grid-cols-1 gap-4 rounded-lg border border-hairline bg-panel/70 p-4 sm:grid-cols-2">
          <DetailRow label="Transaction ID" value={<span className="tabular">{transaction.id}</span>} />
          <DetailRow label="ATM terminal" value={`${transaction.atmId} · ${transaction.atmCity}`} />
          <DetailRow label="Timestamp" value={<span className="tabular">{formatDateTime(transaction.timestamp)}</span>} />
          <DetailRow label="Transaction type" value={transaction.type} />
          <DetailRow label="Transaction amount" value={formatMwkCurrency(transaction.amount)} />
          <DetailRow label="Transaction status" value={transaction.transactionStatus} />
          <DetailRow label="Balance after transaction" value={formatMwkCurrency(transaction.balanceAfter)} />
          <DetailRow label="Simulated Malawi location" value={transaction.location} />
          <DetailRow
            label="Synthetic source label (not used for review)"
            value={`${transaction.groundTruthAnomaly ? 'Anomaly' : 'Normal'}${transaction.anomalyType !== 'NONE' ? ` · ${transaction.anomalyType}` : ''}`}
          />
          <DetailRow
            label="Location status"
            value={transaction.locationStatus}
          />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          Isolation Forest Model Result
        </h3>

        <div className="mt-3 space-y-4 rounded-lg border border-hairline bg-panel/70 p-4">
          <ScoreBar score={transaction.anomalyScore} risk={transaction.risk} isAnomaly={transaction.isAnomaly} />

          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge risk={transaction.risk} size="sm" />
            <StatusBadge status={transaction.detectionStatus} map="anomaly" size="sm" />
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailRow
              label="Review status"
              value={transaction.isAnomaly ? 'Flagged for review' : 'Not flagged for review'}
            />
            <DetailRow label="Isolation Forest anomaly score" value={formatNumber(transaction.anomalyScore, { maximumFractionDigits: 6 })} />
            <DetailRow label="Anomaly record" value={anomaly ? <span className="tabular">{anomaly.id}</span> : '—'} />
            <DetailRow
              label="Separate MWK 100,000 threshold comparison"
              value={transaction.thresholdRuleFlagged ? 'Flagged by threshold rule' : 'Not flagged by threshold rule'}
            />
          </dl>

          <p className="rounded-lg border border-warn/25 bg-warn/5 px-3 py-2 text-[11px] leading-5 text-warn">
          All transaction, account, and ATM data are synthetic. A model anomaly is not proof of
          fraud. The MWK 100,000 threshold comparison and injected source label are separate from
          the Isolation Forest result.
          </p>
        </div>
      </section>

      {anomaly ? (
        <div className="flex flex-wrap gap-2 border-t border-hairline pt-4">
          <Button variant="primary" size="sm" onClick={onViewAnomaly} icon={TriangleAlert}>
            Open anomaly investigation
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default TransactionDetails
