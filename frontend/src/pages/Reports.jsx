import { useState } from 'react'
import {
  Activity,
  FileSpreadsheet,
  Network,
  ShieldAlert,
  TriangleAlert,
  Waypoints,
} from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import ErrorState from '../components/common/ErrorState'
import StatCard from '../components/common/StatCard'
import FilterSelect from '../components/common/FilterSelect'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Card, CardHeader } from '../components/common/Card'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { reportService } from '../services'
import { formatNumber, formatPercent } from '../utils/format'

const REPORT_ICONS = { Activity, TriangleAlert, Network, ShieldAlert }

/**
 * Reports are generated client-side from the precomputed local CSV results.
 */
export function Reports() {
  const [range, setRange] = useState('7d')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  const { data, error, refetch } = useServiceQuery(() => reportService.fetchReportOverview(range), {
    deps: [range],
  })

  const summary = data?.summary

  const downloadCsv = async (type, reportName) => {
    setExporting(true)
    setExportError(null)
    try {
      const anomaliesOnly = type === 'anomalies'
      const csv = type === 'report'
        ? await reportService.requestReportExport('csv', range, reportName)
        : await reportService.requestTransactionExport(range, anomaliesOnly)
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const downloadName = reportName ?? (anomaliesOnly ? 'anomaly-report' : 'transaction-records')
      link.download = `atm-sentinel-${range}-${downloadName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'CSV export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <PageContainer className="space-y-5">
      <Card padding="sm" className="text-[11px] leading-5 text-dim">
        Reports use local synthetic demonstration data. Locations and ATM identifiers are simulated.
        Anomaly flags and scores come from the precomputed Isolation Forest model; the MWK 100,000
        threshold rule is reported separately and does not determine model flags.
        CSV files are generated and downloaded in this browser.
      </Card>

      <SectionHeader
        level={2}
        eyebrow="Reporting"
        title="Download Report"
        description="Download local synthetic transactions or Isolation Forest anomaly results as CSV files."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              loading={exporting}
              disabled={!summary || exporting}
              onClick={() => void downloadCsv('transactions')}
            >
              Download transactions
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={TriangleAlert}
              loading={exporting}
              disabled={!summary || exporting}
              onClick={() => void downloadCsv('anomalies')}
            >
              Download anomalies
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          description="Reporting metadata could not be read."
          detail={error.message}
          onRetry={refetch}
        />
      ) : null}
      {exportError ? (
        <p className="rounded-lg border border-risk/25 bg-risk/5 px-3 py-2 text-xs text-risk" role="alert">
          CSV export failed: {exportError}
        </p>
      ) : null}

      <section aria-label="Report summary" className="rounded-xl border border-hairline bg-panel/80 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-xs">
            <FilterSelect
              label="Reporting period"
              value={range}
              onChange={setRange}
              options={(data?.dateRanges ?? []).map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <p className="text-xs text-dim">
            Summary period:{' '}
            <span className="font-semibold text-body">
              {(data?.dateRanges ?? []).find((option) => option.value === range)?.label ?? '—'}
            </span>
          </p>
          <p className="mt-2 w-full text-[11px] text-dim">
            Selected transaction dates: {summary?.dateRange?.earliest ?? '—'} to {summary?.dateRange?.latest ?? '—'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Synthetic transactions"
            value={formatNumber(summary?.totalTransactions ?? 0)}
            hint="Individual generated transaction records in the selected period"
            icon={Activity}
            tone="brand"
          />
          <StatCard
            label="Flagged for review"
            value={formatNumber(summary?.totalAnomalies ?? 0)}
            hint={`${formatPercent(summary?.anomalyRate ?? 0, { decimals: 2 })} of selected transactions`}
            icon={TriangleAlert}
            tone="warn"
          />
          <StatCard
            label="High-priority review flags"
            value={formatNumber(summary?.highRiskAnomalies ?? 0)}
            hint="Isolation Forest model flags in the current report"
            icon={ShieldAlert}
            tone="risk"
          />
          <StatCard
            label="ATM activity"
            value={`${summary?.atmActivity?.monitored ?? 0} terminals`}
            hint={`Average model anomaly rate across monitored ATMs: ${formatPercent(summary?.atmActivity?.averageAnomalyRate, { decimals: 2 })}`}
            icon={Waypoints}
            tone="ok"
          />
        </div>

        <p className="mt-4 border-t border-hairline/70 pt-3 text-[11px] text-dim">
          {summary?.atmActivity?.highRisk ?? 0} simulated ATMs have at least one high-risk model anomaly.
          Average daily transaction count: {formatNumber(summary?.dailyAverage ?? 0)}.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Report breakdowns">
        <Card>
          <CardHeader title="Isolation Forest risk breakdown" description="Risk levels and flagged counts come from model-generated scores and predictions." />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-dim">
                <tr>
                  <th scope="col" className="py-2">Risk level</th>
                  <th scope="col" className="py-2 text-right">Transactions</th>
                  <th scope="col" className="py-2 text-right">Model-flagged</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary?.riskDistribution ?? {}).map(([risk, count]) => (
                  <tr key={risk} className="border-t border-hairline/60">
                    <th scope="row" className="py-2 font-medium text-body">{risk}</th>
                    <td className="py-2 text-right tabular-nums text-body">{formatNumber(count)}</td>
                    <td className="py-2 text-right tabular-nums text-body">
                      {formatNumber(summary?.flaggedRiskDistribution?.[risk] ?? 0)}
                    </td>
                  </tr>
                ))}
                {!Object.keys(summary?.riskDistribution ?? {}).length ? (
                  <tr><td colSpan="3" className="py-3 text-dim">No transactions for this period.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="ATM activity" description="Simulated terminals ranked by transaction count; export contains every terminal." />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-dim">
                <tr>
                  <th scope="col" className="py-2">ATM</th>
                  <th scope="col" className="py-2 text-right">Transactions</th>
                  <th scope="col" className="py-2 text-right">Flagged</th>
                  <th scope="col" className="py-2 text-right">Model anomaly rate</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.atmSummaries ?? []).slice(0, 10).map((atm) => (
                  <tr key={atm.atmId} className="border-t border-hairline/60">
                    <th scope="row" className="py-2 font-medium text-body">{atm.atmId}</th>
                    <td className="py-2 text-right tabular-nums text-body">{formatNumber(atm.transactions)}</td>
                    <td className="py-2 text-right tabular-nums text-body">{formatNumber(atm.anomalies)}</td>
                    <td className="py-2 text-right tabular-nums text-body">{formatPercent(atm.anomalyRate, { decimals: 2 })}</td>
                  </tr>
                ))}
                {!summary?.atmSummaries?.length ? (
                  <tr><td colSpan="4" className="py-3 text-dim">No ATM activity for this period.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section aria-label="Available report types" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(data?.types ?? []).map((report) => {
          const Icon = REPORT_ICONS[report.icon] ?? Activity

          return (
            <Card key={report.id} interactive className="flex h-full flex-col">
              <CardHeader
                title={report.name}
                description={report.description}
                icon={Icon}
                actions={
                  <Badge tone="dim" size="sm">
                    {report.frequency}
                  </Badge>
                }
              />

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <Button
                  variant="primary"
                  size="sm"
                  loading={exporting}
                  disabled={!summary || exporting}
                  onClick={() => void downloadCsv('report', report.name)}
                >
                  Generate CSV
                </Button>
                <Badge tone="ok" size="sm">
                  CSV available
                </Badge>
              </div>
            </Card>
          )
        })}
      </section>

      <Card className="text-[11px] leading-5 text-dim">
        <p className="font-semibold text-muted">Current limitations</p>
        <ul className="mt-2 space-y-1.5">
          <li>· CSV reports are generated locally and downloaded; scheduling, server-side storage and PDF rendering are not available.</li>
          <li>· Transaction fields and Isolation Forest results come from the local CSV; the threshold comparison is separate. Nothing is sent to Supabase.</li>
          <li>· The report includes dataset counts, selected date coverage, model risk distribution and ATM-level summaries.</li>
        </ul>
      </Card>

    </PageContainer>
  )
}

export default Reports
