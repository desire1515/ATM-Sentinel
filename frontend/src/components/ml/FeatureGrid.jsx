import { Layers } from 'lucide-react'
import { Card, CardHeader } from '../common/Card'
import { Badge } from '../common/Badge'

/**
 * Input fields included in the results dataset.
 */
export function FeatureGrid({ features = [], className }) {
  return (
    <Card className={className}>
      <CardHeader
        title="Source dataset fields"
        description="Behavioral features used by Isolation Forest; identifier and label fields are excluded."
        icon={Layers}
        actions={
          <Badge tone="warn" size="sm">
            Source fields
          </Badge>
        }
      />

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <li
            key={feature.id}
            className="rounded-lg border border-hairline bg-panel-soft/40 p-3.5 transition-colors hover:border-brand/30"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-body">{feature.name}</p>
              <Badge tone="dim" size="sm">
                {feature.status}
              </Badge>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-muted">{feature.description}</p>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-hairline/70 pt-3 text-[11px] leading-5 text-dim">
        Categorical fields are one-hot encoded; time is encoded cyclically. The model does not use transaction/account IDs or injected ground-truth labels.
      </p>
    </Card>
  )
}

export default FeatureGrid
