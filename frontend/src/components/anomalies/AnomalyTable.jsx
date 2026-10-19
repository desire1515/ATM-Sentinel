import { Search } from 'lucide-react'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import RiskBadge from '../common/RiskBadge'
import StatusBadge from '../common/StatusBadge'
import ScoreBar from '../common/ScoreBar'
import { Button } from '../common/Button'
import { formatDateTime, formatMwkCurrency } from '../../utils/format'

/**
 * Isolation Forest anomaly predictions for synthetic transactions. A flag
 * prompts review and does not establish actual fraud.
 */
export function AnomalyTable({
  rows,
  loading = false,
  dense = false,
  sortToken,
  onSortChange,
  footer,
  minWidth = 'min-w-[1050px]',
  emptyState,
}) {
  const columns = [
    {
      key: 'id',
      header: 'Transaction',
      sortKey: 'id',
      render: (row) => (
        <span className="min-w-0">
          <span className="tabular block text-sm font-semibold text-body">
            {row.id}
          </span>
          <span className="block truncate text-[11px] text-dim">
            {row.type}
          </span>
        </span>
      ),
    },

    {
      key: 'atm',
      header: 'ATM',
      sortKey: 'atmId',
      render: (row) => (
        <span className="min-w-0">
          <span className="tabular block text-xs font-medium text-body">
            {row.atmId}
          </span>
          <span className="block max-w-[190px] truncate text-[11px] text-dim">
            ATM terminal
          </span>
        </span>
      ),
    },

    {
      key: 'amount',
      header: 'Amount (MWK)',
      align: 'right',
      sortKey: 'amount',
      render: (row) => (
        <span className="tabular whitespace-nowrap text-xs font-semibold text-body">
          {formatMwkCurrency(row.amount)}
        </span>
      ),
    },

    {
      key: 'location',
      header: 'Simulated Malawi location',
      render: (row) => (
        <span className="block max-w-[220px] truncate text-xs text-dim">{row.location}</span>
      ),
    },

    {
      key: 'timestamp',
      header: 'Transaction time',
      sortKey: 'timestamp',
      render: (row) => (
        <span className="tabular whitespace-nowrap text-xs text-muted">
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },

    {
      key: 'anomalyScore',
      header: 'Flag status',
      sortKey: 'score',
      render: (row) => (
        <span className="flex min-w-[145px] flex-col gap-1">
          <ScoreBar
            score={row.anomalyScore}
            risk={row.risk}
            isAnomaly={row.isAnomaly}
            size="sm"
          />
          <span className="tabular text-[10px] text-dim">
            {row.isAnomaly ? 'Flagged' : 'Cleared'}
          </span>
        </span>
      ),
    },

    {
      key: 'risk',
      header: 'Risk',
      sortKey: 'risk',
      render: (row) => (
        <RiskBadge
          risk={row.risk}
          size="sm"
        />
      ),
    },

    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.detectionStatus}
          map="anomaly"
          size="sm"
        />
      ),
    },

    {
      key: 'actions',
      header: 'Review',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Search}
          to={`/anomalies/${row.id}`}
        >
          <span className="sr-only">
            Investigate {row.id}
          </span>

          <span
            aria-hidden="true"
            className="hidden sm:inline"
          >
            Investigate
          </span>
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      dense={dense}
      sortToken={sortToken}
      onSortChange={onSortChange}
      footer={footer}
      minWidth={minWidth}
      ariaLabel="Isolation Forest flagged observations"
      emptyState={
        emptyState ?? (
          <EmptyState
            title="No flagged observations found."
            description="No Isolation Forest anomaly matches the selected filters."
          />
        )
      }
    />
  )
}

export default AnomalyTable
