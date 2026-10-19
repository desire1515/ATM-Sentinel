import { Eye } from 'lucide-react'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import RiskBadge from '../common/RiskBadge'
import StatusBadge from '../common/StatusBadge'
import ScoreBar from '../common/ScoreBar'
import { Button } from '../common/Button'
import { formatDateTime, formatMwkCurrency } from '../../utils/format'

/**
 * Synthetic individual transaction table. Model results are kept
 * distinct from injected source labels and do not establish actual fraud.
 */
export function TransactionTable({
  rows,
  loading = false,
  dense = false,
  sortToken,
  onSortChange,
  onSelect,
  emptyState,
  footer,
}) {
  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      sortKey: 'id',
      render: (row) => (
        <span className="tabular font-semibold text-body">{row.id}</span>
      ),
    },
    {
      key: 'atm',
      header: 'ATM',
      sortKey: 'atmId',
      render: (row) => (
        <span className="min-w-0">
          <span className="tabular block text-xs font-medium text-body">{row.atmId}</span>
          <span className="block truncate text-[11px] text-dim">{row.branch}</span>
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Date / time',
      sortKey: 'timestamp',
      render: (row) => (
        <span className="tabular whitespace-nowrap text-xs text-muted">
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Transaction type',
      render: (row) => <span className="whitespace-nowrap text-xs text-muted">{row.type}</span>,
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
        <span className="block max-w-[190px] truncate text-xs text-dim">{row.location}</span>
      ),
    },
    {
      key: 'anomalyScore',
      header: 'Model result',
      sortKey: 'score',
      render: (row) => <ScoreBar score={row.anomalyScore} risk={row.risk} isAnomaly={row.isAnomaly} size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} map="transaction" size="sm" />,
    },
    {
      key: 'risk',
      header: 'Risk',
      sortKey: 'risk',
      render: (row) => <RiskBadge risk={row.risk} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (row) => (
        <Button variant="ghost" size="sm" icon={Eye} onClick={() => onSelect?.(row)}>
          <span className="sr-only">View details for {row.id}</span>
          <span aria-hidden="true" className="hidden sm:inline">
            View
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
      onRowClick={onSelect}
      ariaLabel="Synthetic transaction records"
      footer={footer}
      minWidth="min-w-[1180px]"
      emptyState={
        emptyState ?? (
          <EmptyState
            title="No transactions match these filters"
            description="Try widening the time period, clearing the search text, or removing the risk and status filters."
          />
        )
      }
    />
  )
}

export default TransactionTable
