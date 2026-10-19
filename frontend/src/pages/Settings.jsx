import { CheckCircle2, Database, Info, MonitorSmartphone, Palette, RefreshCw, RotateCcw, Server } from 'lucide-react'
import PageContainer from '../components/layout/PageContainer'
import SectionHeader from '../components/common/SectionHeader'
import { Card, CardHeader } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import Toggle from '../components/common/Toggle'
import { usePreferences } from '../context/preferences-context'
import { APP_META } from '../utils/constants'
import { loadMlRecords } from '../services/mlDataAdapter'
import { useServiceQuery } from '../hooks/useServiceQuery'
import { formatMalawiDateTime } from '../utils/format'

export function Settings() {
  const { darkMode, compactMode, autoRefresh, showAnomalyAlerts, updatePreference, resetPreferences, refresh, lastUpdated, datasetStatus, isRefreshing, autoRefreshIntervalMs } = usePreferences()
  const datasetQuery = useServiceQuery(() => loadMlRecords())
  const ready = datasetStatus.state === 'success'
  return <PageContainer className="space-y-5">
    <SectionHeader level={2} eyebrow="Configuration" title="Settings" description="Local preferences and presentation dataset information." />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="flex h-full flex-col"><CardHeader title="Appearance" description="How the monitoring interface is displayed." icon={Palette} /><div className="mt-4 space-y-3"><Toggle checked={darkMode} onChange={(value) => updatePreference('darkMode', value)} label="Dark mode" description="Use the dark security theme or switch to a light theme." /><Toggle checked={compactMode} onChange={(value) => updatePreference('compactMode', value)} label="Compact mode" description="Fit more rows into data tables." /></div></Card>
      <Card className="flex h-full flex-col"><CardHeader title="Dashboard" description="Presentation display behaviour." icon={MonitorSmartphone} /><div className="mt-4 space-y-3"><Toggle checked={autoRefresh} onChange={(value) => updatePreference('autoRefresh', value)} label="Auto refresh" description={`Re-reads the local model-results CSV every ${Math.round(autoRefreshIntervalMs / 1000)} seconds.`} /><Toggle checked={showAnomalyAlerts} onChange={(value) => updatePreference('showAnomalyAlerts', value)} label="Show review alerts" description="Show Isolation Forest model flags in the header." /></div><div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline/70 pt-4"><p className="text-[11px] text-dim">Last refresh: <span className="tabular text-muted">{formatMalawiDateTime(lastUpdated)}</span></p><Button variant="secondary" size="sm" icon={RefreshCw} onClick={refresh}>Refresh data</Button></div></Card>
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card><CardHeader title="Demonstration data" description="The full local model-results dataset is shared by all pages." icon={Database} /><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-2"><dt className="text-muted">Data source</dt><dd className="font-semibold text-body">Synthetic Malawi Isolation Forest CSV</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Dataset status</dt><dd><Badge tone={ready ? 'ok' : 'warn'} size="sm" icon={ready ? CheckCircle2 : undefined}>{ready ? `${datasetStatus.count} model-results records loaded` : datasetQuery.loading ? 'Loading…' : 'Not verified'}</Badge></dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Separate comparison</dt><dd className="text-right text-body">MWK 100,000 withdrawal threshold</dd></div></dl><p className="mt-4 rounded-lg border border-hairline bg-panel-soft/40 p-3 text-[11px] leading-5 text-muted">All records are synthetic demonstration data, not real banking records. Isolation Forest anomaly flags prompt review; they are not confirmed fraud findings. The threshold rule is separate.</p></Card>
      <Card><CardHeader title="System" description="Prototype runtime information." icon={Server} /><dl className="mt-4 space-y-3 text-xs"><div className="flex justify-between gap-2"><dt className="text-muted">Version</dt><dd className="font-semibold text-body">{APP_META.version}</dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Authentication</dt><dd><Badge tone="ok" size="sm">Not required</Badge></dd></div><div className="flex justify-between gap-2"><dt className="text-muted">Backend connection</dt><dd><Badge tone="dim" size="sm">Not used</Badge></dd></div></dl><p className="mt-4 flex gap-2 border-t border-hairline/70 pt-4 text-[11px] leading-5 text-dim"><Info className="h-3.5 w-3.5 shrink-0" />This presentation prototype runs entirely in the browser and does not change database security policies.</p></Card>
    </div>
    <Card><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-body">Reset display preferences</p><p className="mt-1 text-xs text-muted">Restore the presentation defaults for this browser.</p></div><Button variant="ghost" size="sm" icon={RotateCcw} loading={isRefreshing} onClick={resetPreferences}>Reset preferences</Button></div></Card>
  </PageContainer>
}
export default Settings
