import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import { Card } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { NAV_ITEMS } from '../utils/constants'

/** Catch-all fallback so a mistyped route never produces a blank screen. */
export function NotFound() {
  return (
    <PageContainer>
      <Card padding="lg" className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-brand/40 bg-brand/10 text-brand">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-dim">Error 404</p>
        <h2 className="mt-1 text-xl font-semibold text-body">This monitoring view does not exist</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          The route you requested is not part of the ATM SENTINEL frontend. Choose one of the
          monitoring screens below to continue.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <Button key={item.to} to={item.to} variant="secondary" size="sm">
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-brand transition-colors hover:text-body"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Security Overview
          </Link>
        </div>
      </Card>
    </PageContainer>
  )
}

export default NotFound
