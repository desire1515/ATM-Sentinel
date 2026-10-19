import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleHelp, Database, ShieldAlert, TriangleAlert, Waypoints } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'
import { Card, CardHeader } from '../components/common/Card'
import { Button } from '../components/common/Button'
import RiskBadge from '../components/common/RiskBadge'
import StatusBadge from '../components/common/StatusBadge'
import AnomalyCard from '../components/anomalies/AnomalyCard'
import AnomalyScore from '../components/anomalies/AnomalyScore'
import { DetailRow } from '../components/transactions/TransactionDetails'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { anomalyService, atmService } from '../services'
import { formatDateTime, formatNumber, formatMwkCurrency } from '../utils/format'

export function AnomalyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const anomalyQuery = useServiceQuery(() => anomalyService.fetchAnomalyById(id), { deps: [id] })
  const anomaly = anomalyQuery.data
  const atmQuery = useServiceQuery(() => atmService.fetchAtmById(anomaly.atmId), {
    deps: [anomaly?.atmId],
    enabled: Boolean(anomaly?.atmId),
  })
  const relatedQuery = useServiceQuery(() => anomalyService.fetchAnomaliesForAtm(anomaly.atmId), {
    deps: [anomaly?.atmId],
    enabled: Boolean(anomaly?.atmId),
  })
  const related = useMemo(
    () => (relatedQuery.data ?? []).filter((item) => item.id !== id).slice(0, 3),
    [relatedQuery.data, id],
  )

  if (anomalyQuery.loading) {
    return (
      <PageContainer>
        <Card padding="lg">
          <LoadingState label="Loading demonstration review flag…" />
        </Card>
      </PageContainer>
    )
  }

  if (anomalyQuery.error) {
    return (
      <PageContainer>
        <ErrorState
          description="The anomaly record could not be read."
          detail={anomalyQuery.error.message}
          onRetry={anomalyQuery.refetch}
        />
      </PageContainer>
    )
  }

  if (!anomaly?.isAnomaly) {
    return (
      <PageContainer>
        <EmptyState
          title="Anomaly record not found"
          description={`No review-flagged transaction exists with the reference ${id}. Check the transaction ID and try again.`}
          action={
            <Button variant="primary" size="sm" to="/anomalies" icon={ArrowLeft}>
              Back to Anomalies
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const atm = atmQuery.data

  return (
    <PageContainer className="space-y-5">
      <SectionHeader
        level={2}
        eyebrow="Investigation"
        title={`Flagged transaction ${anomaly.transactionId}`}
        description={`Isolation Forest flagged this synthetic transaction as anomalous (score ${formatNumber(anomaly.anomalyScore, { maximumFractionDigits: 6 })}). This is not a confirmed fraud finding.`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/anomalies')}
          >
            Back to Anomalies
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Synthetic transaction"
            description="Transaction fields are simulated; this row does not represent real banking activity."
            icon={Database}
          />

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow label="Transaction ID" value={<span className="tabular">{anomaly.transactionId}</span>} />
            <DetailRow label="Simulated ATM ID" value={anomaly.atmId} />
            <DetailRow label="Timestamp" value={<span className="tabular">{formatDateTime(anomaly.timestamp)}</span>} />
            <DetailRow label="Transaction type" value={anomaly.type} />
            <DetailRow label="Amount" value={formatMwkCurrency(anomaly.amount)} />
            <DetailRow label="Transaction status" value={anomaly.transactionStatus} />
            <DetailRow label="Hour of day" value={formatNumber(anomaly.hour)} />
            <DetailRow label="Simulated Malawi location" value={anomaly.location} />
            <DetailRow
              label="Location status"
              value={anomaly.locationStatus}
            />
            <DetailRow label="Injected ground-truth label" value={anomaly.groundTruthAnomaly ? 'Anomaly (synthetic)' : 'Normal (synthetic)'} />
          </dl>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline/70 pt-4">
            <Button
              variant="ghost"
              size="sm"
              to={`/transactions?txn=${encodeURIComponent(anomaly.id)}`}
              icon={TriangleAlert}
            >
              Open in transaction explorer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              to={`/atm-network?atm=${encodeURIComponent(anomaly.atmId)}`}
              icon={Waypoints}
            >
              View terminal
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Isolation Forest result"
            description="Precomputed Isolation Forest classification and decision score."
            icon={ShieldAlert}
            headingLevel={3}
          />
          <div className="mt-5 flex flex-1 flex-col items-center justify-center">
            <AnomalyScore score={anomaly.anomalyScore} risk={anomaly.risk} isAnomaly={anomaly.isAnomaly} />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <RiskBadge risk={anomaly.risk} size="sm" />
              <StatusBadge status={anomaly.detectionStatus} map="anomaly" size="sm" />
            </div>
            <p className="mt-3 text-center text-[11px] leading-5 text-dim">
              Isolation Forest prediction: Anomaly. The score is not a fraud probability; the MWK threshold is evaluated separately.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Transaction fields"
            description="These generated inputs are not feature-attribution explanations."
            icon={CircleHelp}
          />
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailRow
              label="Transaction amount (MWK)"
              value={formatMwkCurrency(anomaly.amount)}
            />
            <DetailRow
              label="Balance after (MWK)"
              value={formatMwkCurrency(anomaly.balanceAfter)}
            />
            <DetailRow
              label="Transaction status"
              value={anomaly.transactionStatus}
            />
            <DetailRow
              label="Weekend"
              value={anomaly.is_weekend ? 'Yes' : 'No'}
            />
          </dl>
        </Card>

        <Card className="flex h-full flex-col">
          <CardHeader
            title="Terminal context"
            description="Synthetic transaction totals and Isolation Forest anomalies for this simulated ATM."
            icon={Database}
            headingLevel={3}
          />
          {atmQuery.loading ? (
            <LoadingState label="Loading terminal records…" />
          ) : atm ? (
            <dl className="mt-4 space-y-3">
              <DetailRow label="Terminal" value={atm.name} />
              <DetailRow label="Malawi demonstration location" value={atm.location} />
              <DetailRow label="Highest risk" value={<RiskBadge risk={atm.risk} size="sm" />} />
              <DetailRow label="Transactions" value={formatNumber(atm.transactionCount)} />
              <DetailRow label="Flagged anomalies" value={formatNumber(atm.anomalyCount)} />
              <DetailRow label="Anomaly rate" value={`${atm.anomalyRate}%`} />
            </dl>
          ) : (
            <p className="mt-4 text-xs text-muted">Terminal details are unavailable for this record.</p>
          )}
          <Link
            to={`/atm-network?atm=${encodeURIComponent(anomaly.atmId)}`}
            className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[11px] font-medium text-brand hover:text-body"
          >
            Open ATM network view
            <Waypoints className="h-3 w-3" aria-hidden="true" />
          </Link>
        </Card>
      </div>

      <section aria-label="Related anomalies at this terminal">
        <CardHeader
          title="Related model anomalies at this terminal"
          description="Other Isolation Forest anomalies at the same ATM."
          icon={TriangleAlert}
          headingLevel={2}
        />
        {related.length === 0 ? (
          <EmptyState
            className="mt-4"
            compact
            title="No other anomalies at this terminal"
            description="No other transactions at this ATM are flagged in the current dataset."
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => <AnomalyCard key={item.id} anomaly={item} />)}
          </div>
        )}
      </section>
    </PageContainer>
  )
}


export default AnomalyDetails
