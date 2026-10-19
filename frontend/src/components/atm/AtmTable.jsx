import { Eye } from 'lucide-react'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'
import RiskBadge from '../common/RiskBadge'
import { Button } from '../common/Button'
import { formatNumber, formatRelativeTime } from '../../utils/format'

/** Terminal inventory table (alternative to the card grid). */
export function AtmTable({ rows = [], loading = false, dense = false, onSelect, footer }) {
  const columns = [
    {
      key: 'id',
      header: 'ATM ID',
      render: (row) => (
        <span className="tabular whitespace-nowrap text-xs font-semibold text-brand">{row.id}</span>
      ),
    },
    {
      key: 'name',
      header: 'Terminal',
      render: (row) => (
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-body">{row.name}</span>
          <span className="block truncate text-[11px] text-dim">
            Synthetic ATM label
          </span>
        </span>
      ),
    },
    {
      key: 'district',
      header: 'Simulated Malawi location',
      render: (row) => (
        <span className="block max-w-[210px] truncate text-xs text-dim">{row.location}</span>
      ),
    },
    {
      key: 'risk',
      header: 'Highest risk',
      render: (row) => <RiskBadge risk={row.risk} size="sm" />,
    },
    {
      key: 'transactions',
      header: 'Transactions',
      align: 'right',
      sortKey: 'transactions',
      render: (row) => (
        <span className="tabular text-xs text-body">
          {formatNumber(row.transactionCount)}
        </span>
      ),
    },
    {
      key: 'anomalies',
      header: 'Anomalies',
      align: 'right',
      sortKey: 'anomalies',
      render: (row) => (
        <span className="tabular text-xs font-semibold text-warn">
          {formatNumber(row.anomalyCount ?? row.anomalies ?? 0)}
        </span>
      ),
    },
    {
      key: 'anomalyRate',
      header: 'Anomaly rate',
      align: 'right',
      render: (row) => <span className="tabular text-xs text-muted">{row.anomalyRate}%</span>,
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      align: 'right',
      render: (row) => (
        <span className="tabular text-xs text-muted">{formatNumber(row.transactionCount)}</span>
      ),
    },
    {
      key: 'lastActivity',
      header: 'Last activity',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-dim">
          {formatRelativeTime(row.lastActivity)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (row) => (
        <Button variant="ghost" size="sm" icon={Eye} onClick={() => onSelect?.(row)}>
          <span className="sr-only">View findings for {row.id}</span>
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
      footer={footer}
      minWidth="min-w-[1080px]"
      ariaLabel="ATM terminal inventory"
      emptyState={
        <EmptyState
          title="No terminals match these filters"
          description="Clear the search text or select a different risk level."
        />
      }
    />
  )
}

export default AtmTable
