import {
  Blocks,
  BrainCircuit,
  Database,
  Gauge,
  LayoutDashboard,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { Card, CardHeader } from '../common/Card'
import { Badge } from '../common/Badge'

const ICONS = {
  Database,
  BrainCircuit,
  Sparkles,
  Blocks,
  SlidersHorizontal,
  Gauge,
  TriangleAlert,
  LayoutDashboard,
}

/**
 * Summarizes the precomputed model-results data path.
 */
export function MlPipeline({ stages = [], className }) {
  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader
        title="Results data path"
        description="From synthetic transactions through model scoring to shared dashboard summaries."
        icon={BrainCircuit}
        actions={
          <Badge tone="warn" size="sm">
            CSV-backed
          </Badge>
        }
      />

      <ol className="mt-4 space-y-2">
        {stages.map((stage, index) => {
          const Icon = ICONS[stage.icon] ?? Blocks
          const isModelStage = stage.id === 'model'

          return (
            <li key={stage.id}>
              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3',
                  isModelStage
                    ? 'border-brand/50 bg-brand/10'
                    : 'border-hairline bg-panel-soft/40',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold',
                    isModelStage
                      ? 'border-brand/50 bg-brand/15 text-brand'
                      : 'border-hairline bg-panel text-muted',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-body">
                      {index + 1}. {stage.label}
                    </span>
                    {isModelStage ? (
                      <Badge tone="brand" size="sm">
                        Model
                      </Badge>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-5 text-muted">
                    {stage.detail}
                  </span>
                </span>
              </div>

              {index < stages.length - 1 ? (
                <div aria-hidden="true" className="flex justify-center py-0.5">
                  <span className="h-3 w-px bg-hairline" />
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export default MlPipeline
