import { Activity, Info } from 'lucide-react'
import { SYNTHETIC_MALAWI_DATASET } from '../../config/geography'

export function SourceContextBanner() {
  return (
    <aside
      aria-label="Operating mode and data provenance"
      className="flex flex-col gap-2 border-b border-hairline bg-panel/60 px-4 py-3 text-[11px] leading-5 text-muted sm:px-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">
          Operating Mode
        </p>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-warn">
          <Activity className="h-3.5 w-3.5" aria-hidden="true" />
          Prototype · No Live Bank Connection
        </p>
      </div>
      <p className="flex items-start gap-2">
        <Info className="mt-1 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
        <span>
          Synthetic Malawi demonstration data only — not real bank activity or verified ATM locations.
          The sample covers {SYNTHETIC_MALAWI_DATASET.dateStart} to {SYNTHETIC_MALAWI_DATASET.dateEnd};
          model-flagged anomalies prompt review and do not prove fraud.
        </span>
      </p>
    </aside>
  )
}

export default SourceContextBanner
