import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Activity, RefreshCw, ShieldAlert, TriangleAlert, Wallet } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import Drawer from '../components/common/Drawer'
import Pagination from '../components/common/Pagination'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import StatCard from '../components/common/StatCard'
import TransactionFilters from '../components/transactions/TransactionFilters'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionDetails from '../components/transactions/TransactionDetails'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { usePagination } from '../hooks/usePagination'
import { usePreferences } from '../context/preferences-context'
import { anomalyService, transactionService } from '../services'
import { DEFAULT_PAGE_SIZE } from '../utils/constants'
import { formatNumber } from '../utils/format'

const INITIAL_FILTERS = {
  query: '',
  atmId: 'all',
  location: 'all',
  type: 'all',
  risk: 'all',
  status: 'all',
  timeframe: 'all',
  onlyAnomalies: false,
}

/** Stable empty array so memoised selectors do not re-run on every render. */
const EMPTY_RECORDS = []

/**
 * Transaction explorer.
 * Search, filtering, sorting and pagination are client-side over synthetic
 * Malawi transactions with precomputed Isolation Forest predictions.
 * Existing /transactions?txn=<transaction-id> links open the detail drawer
 * directly (used by the header search).
 */
export function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { compactMode } = usePreferences()

  const [filters, setFilters] = useState(() => ({
    ...INITIAL_FILTERS,
    query: searchParams.get('q') ?? '',
  }))
  const [sort, setSort] = useState('timestamp-desc')
  const [selectedId, setSelectedId] = useState(null)

  const transactionsQuery = useServiceQuery(() => transactionService.fetchTransactions())
  const anomaliesQuery = useServiceQuery(() => anomalyService.fetchAnomalies())

  const records = useMemo(
    () => transactionsQuery.data?.records ?? EMPTY_RECORDS,
    [transactionsQuery.data],
  )
  const anomalies = useMemo(
    () => anomaliesQuery.data?.records ?? EMPTY_RECORDS,
    [anomaliesQuery.data],
  )

  const anomalyByTransaction = useMemo(() => {
    const map = new Map()
    anomalies.forEach((anomaly) => map.set(anomaly.transactionId, anomaly))
    return map
  }, [anomalies])

  const { records: filtered, totals } = useMemo(
    () => transactionService.queryTransactions(records, { filters, sort }),
    [records, filters, sort],
  )

  const pagination = usePagination(filtered, { pageSize: DEFAULT_PAGE_SIZE })
  const { setPage } = pagination

  // Page resets happen in the events that invalidate the result set, which keeps
  // the component free of state-syncing effects.
  const updateFilters = (next) => {
    setFilters(next)
    setPage(1)
    const nextSearchParams = new URLSearchParams(searchParams)
    if (next.query.trim()) nextSearchParams.set('q', next.query)
    else nextSearchParams.delete('q')
    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }

  const updateSort = (token) => {
    setSort(token)
    setPage(1)
  }

  // Deep link: /transactions?txn=TXN-000123 (derived, so no sync effect).
  const requestedId = searchParams.get('txn')
  const activeId =
    requestedId && records.some((record) => record.id === requestedId) ? requestedId : selectedId

  const closeDetails = () => {
    setSelectedId(null)
    if (searchParams.get('txn')) {
      searchParams.delete('txn')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const selected = activeId ? records.find((record) => record.id === activeId) : null
  const selectedAnomaly = selected ? (anomalyByTransaction.get(selected.id) ?? null) : null

  const atmOptions = useMemo(
    () => [
      { value: 'all', label: 'All ATMs' },
      ...[...new Set(records.map((record) => record.atmId))].sort().map((atmId) => ({
        value: atmId,
        label: atmId,
      })),
    ],
    [records],
  )

  const locationOptions = useMemo(
    () => [
      { value: 'all', label: 'All Malawi demonstration locations' },
      ...[...new Set(records.map((record) => record.location))].sort().map((location) => ({
        value: location,
        label: location,
      })),
    ],
    [records],
  )

  return (
    <PageContainer className="space-y-5">
      <SectionHeader
        level={2}
        eyebrow="Synthetic transactions"
        title="Transaction Explorer"
        description={`Search, filter and inspect individual synthetic transactions. ${formatNumber(records.length)} records across the full dataset window.`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={transactionsQuery.refreshing}
            onClick={transactionsQuery.refetch}
          >
            Refresh
          </Button>
        }
      />

      {transactionsQuery.error ? (
        <ErrorState
          description="The transaction service could not be read."
          detail={transactionsQuery.error.message}
          onRetry={transactionsQuery.refetch}
        />
      ) : null}

      <section
        aria-label="Filtered result summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Matching transactions"
          value={formatNumber(totals.total)}
          hint="After the current filter set"
          icon={Wallet}
          tone="brand"
          loading={transactionsQuery.loading}
        />
        <StatCard
          label="Transactions in view"
          value={formatNumber(totals.transactionCount)}
          hint="Each result row represents one transaction."
          icon={Activity}
          tone="ok"
          loading={transactionsQuery.loading}
        />
        <StatCard
          label="Flagged for review"
          value={formatNumber(totals.anomalous)}
          hint="Transactions flagged by the Isolation Forest model"
          icon={TriangleAlert}
          tone="warn"
          loading={transactionsQuery.loading}
        />
        <StatCard
          label="High risk in view"
          value={formatNumber(totals.high)}
          hint="Model-flagged transactions in the current view"
          icon={ShieldAlert}
          tone="risk"
          loading={transactionsQuery.loading}
        />
      </section>

      <TransactionFilters
        filters={filters}
        onChange={updateFilters}
        onReset={() => updateFilters(INITIAL_FILTERS)}
        sort={sort}
        onSortChange={updateSort}
        atmOptions={atmOptions}
        locationOptions={locationOptions}
        resultCount={totals.total}
      />

      <TransactionTable
        rows={pagination.pageItems}
        loading={transactionsQuery.loading}
        dense={compactMode}
        sortToken={sort}
        onSortChange={updateSort}
        onSelect={(row) => setSelectedId(row.id)}
        footer={
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            range={pagination.range}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            itemLabel="transactions"
            className="bg-panel-soft/40"
          />
        }
      />

      <Card padding="sm" className="text-[11px] leading-5 text-dim">
        Each row is synthetic data. Model anomalies prompt review and do not indicate confirmed fraud; the MWK threshold is a separate comparison.
      </Card>

      <Drawer
        open={Boolean(selected)}
        onClose={closeDetails}
        eyebrow="Transaction detail"
        title={selected?.id ?? 'Transaction'}
        description={selected ? `${selected.type} · ${selected.atmId}` : undefined}
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={closeDetails}>
              Back to list
            </Button>
            {selectedAnomaly ? (
              <Button
                variant="primary"
                size="sm"
                icon={TriangleAlert}
                onClick={() => navigate(`/anomalies/${selectedAnomaly.id}`)}
              >
                Investigate anomaly
              </Button>
            ) : null}
          </div>
        }
      >
        <TransactionDetails
          transaction={selected}
          anomaly={selectedAnomaly}
          onViewAnomaly={() => navigate(`/anomalies/${selectedAnomaly.id}`)}
        />
      </Drawer>
    </PageContainer>
  )
}

export default Transactions
