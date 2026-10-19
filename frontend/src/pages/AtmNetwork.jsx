import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Grid3x3,
  Network,
  RefreshCw,
  ShieldAlert,
  Table2,
  TriangleAlert,
  Waypoints,
  WifiOff,
} from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import EmptyState from '../components/common/EmptyState'
import LoadingState from '../components/common/LoadingState'
import StatCard from '../components/common/StatCard'
import SearchInput from '../components/common/SearchInput'
import FilterSelect from '../components/common/FilterSelect'
import SegmentedControl from '../components/common/SegmentedControl'
import Drawer from '../components/common/Drawer'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import RiskBadge from '../components/common/RiskBadge'
import StatusBadge from '../components/common/StatusBadge'
import AtmCard from '../components/atm/AtmCard'
import AtmTable from '../components/atm/AtmTable'
import AtmNetworkMap from '../components/atm/AtmNetworkMap'
import MalawiCityPanel from '../components/atm/MalawiCityPanel'
import { DetailRow } from '../components/transactions/TransactionDetails'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { usePreferences } from '../context/preferences-context'
import { anomalyService, atmService } from '../services'
import { formatNumber, formatRelativeTime } from '../utils/format'

const VIEW_OPTIONS = [
  { value: 'cards', label: 'Cards', icon: Grid3x3 },
  { value: 'table', label: 'Table', icon: Table2 },
]

const EMPTY_RECORDS = []

/**
 * Summarizes synthetic Malawi ATM records and their model outputs.
 */
export function AtmNetwork() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { compactMode } = usePreferences()

  const [view, setView] = useState('cards')
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const { data, loading, refreshing, error, refetch } = useServiceQuery(() => atmService.fetchAtms())

  const records = useMemo(() => data?.records ?? EMPTY_RECORDS, [data])

  const filtered = useMemo(
    () => atmService.queryAtms(records, { query, risk }),
    [records, query, risk],
  )

  // Deep links of the form /atm-network?atm=ATM-004 are honoured by derivation,
  // so no state-syncing effect is required.
  const requestedId = searchParams.get('atm')
  const activeId =
    requestedId && records.some((atm) => atm.id === requestedId) ? requestedId : selectedId

  const selected = useMemo(() => records.find((atm) => atm.id === activeId) ?? null, [records, activeId])

  const anomaliesQuery = useServiceQuery(() => anomalyService.fetchAnomaliesForAtm(activeId), {
    deps: [activeId],
    enabled: Boolean(activeId),
  })

  const selectedAnomalies = useMemo(
    () => (anomaliesQuery.data ?? EMPTY_RECORDS).slice(0, 6),
    [anomaliesQuery.data],
  )

  const closeDetails = () => {
    setSelectedId(null)
    if (searchParams.get('atm')) {
      searchParams.delete('atm')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const resetFilters = () => {
    setQuery('')
    setRisk('all')
  }

  return (
    <PageContainer className="space-y-5">
      <SectionHeader
        level={1}
        title="Malawi-Focused ATM Monitoring Prototype"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={refetch}
          >
            Refresh
          </Button>
        }
      />

      {error ? (
        <ErrorState
          description="The ATM service could not be read."
          detail={error.message}
          onRetry={refetch}
        />
      ) : null}

      <section aria-labelledby="malawi-context-heading" className="space-y-2">
        <h2 id="malawi-context-heading" className="text-base font-semibold text-body">
          ATM Network Context
        </h2>
        <p className="text-xs leading-5 text-muted">
          Every transaction and location shown is simulated for demonstration. Isolation Forest anomaly flags
          are review prompts, not fraud findings, and injected source labels are not used by the model.
        </p>
        <p className="text-xs leading-5 text-muted">
          The map uses simulated coordinates included in the Malawi dataset. They are near
          simulated town locations but do not represent verified ATM installations.
        </p>
        <p className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-xs leading-5 text-body">
          <strong className="font-semibold text-warn">Important:</strong> ATM counts and model
          scores are computed from synthetic transactions; no row is live banking data.
        </p>
      </section>

      <MalawiCityPanel atms={records} />

      <section
        aria-label="Synthetic Malawi dataset summary"
        className="space-y-4"
      >
        <div className="border-b border-hairline/70 pb-3">
          <h3 className="text-sm font-semibold text-body">
            Synthetic Malawi ATM transaction dataset
          </h3>
          <p className="mt-1 text-xs text-muted">
            <strong className="font-semibold text-body">Data period:</strong> 1 January–31 December 2025
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            The dataset contains individual generated transaction rows across 100 simulated ATM
            IDs. Map coordinates and location labels are synthetic and do not identify real sites.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Simulated ATMs"
            value={formatNumber(data?.summary?.totalAtms ?? 0)}
            hint="Unique generated ATM identifiers"
            icon={Network}
            tone="brand"
            loading={loading}
          />
          <StatCard
            label="Transactions"
            value={formatNumber(data?.summary?.totalTransactions ?? 0)}
            hint="Synthetic transaction rows across these ATMs"
            icon={Waypoints}
            tone="ok"
            loading={loading}
          />
          <StatCard
            label="Model-flagged transactions"
            value={formatNumber(data?.summary?.totalAnomalies ?? 0)}
            hint="Transactions flagged by Isolation Forest"
            icon={TriangleAlert}
            tone="warn"
            loading={loading}
          />
          <StatCard
            label="High-risk simulated ATMs"
            value={formatNumber(data?.summary?.highRisk ?? 0)}
            hint="At least one Isolation Forest anomaly"
            icon={ShieldAlert}
            tone="risk"
            loading={loading}
          />
        </div>
      </section>

      <AtmNetworkMap
        atms={filtered}
        loading={loading}
        selectedId={activeId}
        onSelect={(atm) => setSelectedId(atm.id)}
      />

      <section aria-label="Terminal explorer">
        <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-panel/80 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
            <SearchInput
              label="Search terminals"
              value={query}
              onChange={setQuery}
              placeholder="ATM ID or Malawi demonstration location…"
            />

            <FilterSelect
              label="Highest risk"
              value={risk}
              onChange={setRisk}
              options={[
                { value: 'all', label: 'All risk levels' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
                { value: 'Normal', label: 'Normal' },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-dim">
              <span className="tabular font-semibold text-body">{formatNumber(filtered.length)}</span>{' '}
              of {formatNumber(records.length)} terminals
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              disabled={!query && risk === 'all'}
            >
              Clear
            </Button>

            <SegmentedControl
              ariaLabel="Terminal view mode"
              value={view}
              onChange={setView}
              options={VIEW_OPTIONS}
              size="sm"
            />
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <Card padding="lg">
              <LoadingState label="Loading dataset records…" />
            </Card>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No terminals match these filters"
              description="Adjust the search text or choose a different risk level."
              action={
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : view === 'cards' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((atm) => (
                <AtmCard
                  key={atm.id}
                  atm={atm}
                  selected={atm.id === activeId}
                  onSelect={(item) => setSelectedId(item.id)}
                />
              ))}
            </div>
          ) : (
            <AtmTable
              rows={filtered}
              dense={compactMode}
              onSelect={(row) => setSelectedId(row.id)}
            />
          )}
        </div>
      </section>

      <Drawer
        open={Boolean(selected)}
        onClose={closeDetails}
        eyebrow="Terminal detail"
        title={selected ? `${selected.id} — ${selected.name}` : 'Terminal'}
        description={selected?.locationStatus}
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              to={selected ? `/transactions?q=${selected.id}` : '/transactions'}
            >
              Open transactions
            </Button>
            <Button variant="primary" size="sm" to="/anomalies" icon={TriangleAlert}>
              Review anomalies
            </Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Terminal information
              </h3>

              <dl className="mt-3 grid grid-cols-1 gap-4 rounded-lg border border-hairline bg-panel/70 p-4 sm:grid-cols-2">
                <DetailRow label="Terminal ID" value={<span className="tabular">{selected.id}</span>} />
                <DetailRow label="Terminal" value="Simulated ATM" />
                <DetailRow label="Malawi demonstration location" value={selected.location} />
                <DetailRow
                  label="Highest risk"
                  value={<RiskBadge risk={selected.risk} size="sm" />}
                />
                <DetailRow label="Last activity" value={formatRelativeTime(selected.latestActivity)} />
              </dl>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Activity in current view
              </h3>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-hairline bg-panel/70 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-dim">Observations</p>
                  <p className="tabular text-sm font-semibold text-body">
                    {formatNumber(selected.transactionCount)}
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel/70 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-dim">Anomalies</p>
                  <p className="tabular text-sm font-semibold text-warn">
                    {formatNumber(selected.anomalyCount)}
                  </p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel/70 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-dim">Anomaly rate</p>
                  <p className="tabular text-sm font-semibold text-body">{selected.anomalyRate}%</p>
                </div>
                <div className="rounded-lg border border-hairline bg-panel/70 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-dim">Transactions</p>
                  <p className="tabular text-sm font-semibold text-body">
                    {formatNumber(selected.transactionCount)}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Recent findings
              </h3>

              {anomaliesQuery.loading ? (
                <LoadingState label="Loading findings…" />
              ) : selectedAnomalies.length === 0 ? (
                <p className="mt-3 flex items-center gap-2 rounded-lg border border-hairline bg-panel/70 p-3 text-xs text-muted">
                  <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                  No Isolation Forest anomalies were identified at this terminal in the dataset window.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {selectedAnomalies.map((anomaly) => (
                    <li key={anomaly.id}>
                      <Link
                        to={`/anomalies/${anomaly.id}`}
                        onClick={closeDetails}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-panel/70 p-3 transition-colors hover:border-brand/40"
                      >
                        <span className="min-w-0">
                          <span className="tabular block text-xs font-semibold text-body">
                            {anomaly.transactionId}
                          </span>
                          <span className="block text-[11px] text-dim">
                            {anomaly.type} · {formatNumber(anomaly.transactionCount)} transactions ·{' '}
                            {formatRelativeTime(anomaly.timestamp)}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <RiskBadge risk={anomaly.risk} size="sm" />
                          <StatusBadge
                            status={anomaly.detectionStatus}
                            map="anomaly"
                            size="sm"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <LoadingState />
        )}
      </Drawer>
    </PageContainer>
  )
}

export default AtmNetwork
