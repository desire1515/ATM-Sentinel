import { History } from 'lucide-react'
import { Card, CardHeader } from '../common/Card'
import { Badge } from '../common/Badge'
import DataTable from '../common/DataTable'
import EmptyState from '../common/EmptyState'

const STATUS_TONES = { planned: 'warn' }

/**
 * Model run history.
 *
 * The CSV results do not include training-run metadata or evaluation metrics.
 */
export function ModelRunHistory({ runs = [], className }) {
  const columns = [
    {
      key: 'id',
      header: 'Run',
      render: (row) => <span className="tabular text-xs font-semibold text-body">{row.id}</span>,
    },
    {
      key: 'label',
      header: 'Stage',
      render: (row) => <span className="text-xs text-body">{row.label}</span>,
    },
    {
      key: 'algorithm',
      header: 'Algorithm',
      render: (row) => <span className="text-xs text-muted">{row.algorithm}</span>,
    },
    {
      key: 'learningType',
      header: 'Learning type',
      render: (row) => <span className="text-xs text-muted">{row.learningType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={STATUS_TONES[row.status] ?? 'dim'} size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'records',
      header: 'Records',
      align: 'right',
      render: (row) => (
        <span className="tabular text-xs text-muted">
          {row.records ? row.records.toLocaleString('en-US') : '—'}
        </span>
      ),
    },
    {
      key: 'features',
      header: 'Features',
      align: 'right',
      render: (row) => (
        <span className="tabular text-xs text-muted">{row.features || '—'}</span>
      ),
    },
    {
      key: 'note',
      header: 'Notes',
      render: (row) => (
        <span className="block max-w-[320px] text-[11px] leading-5 text-dim">{row.note}</span>
      ),
    },
  ]

  return (
    <Card padding="none" className={className}>
      <div className="p-4 sm:p-5">
        <CardHeader
          title="Model run history"
          description="Training-run metadata is not included in the source dataset."
          icon={History}
          actions={
            <Badge tone="dim" size="sm">
              No run metadata
            </Badge>
          }
        />
      </div>

      <DataTable
        columns={columns}
        rows={runs}
        minWidth="min-w-[1000px]"
        ariaLabel="Model run history"
        emptyState={
          <EmptyState
            compact
            title="No model runs recorded"
            description="Training runs will appear here once the ML pipeline is implemented."
          />
        }
      />
    </Card>
  )
}

export default ModelRunHistory
