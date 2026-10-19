import {
  ArrowLeftRight,
  BarChart3,
  BrainCircuit,
  FileSpreadsheet,
  LayoutDashboard,
  Network,
  Settings,
  TriangleAlert,
} from 'lucide-react'

/**
 * Central application metadata.
 */
export const APP_META = {
  name: 'ATM SENTINEL',
  subtitle: 'Malawi-Focused ATM Monitoring Prototype',
  tagline: 'Research Data. Transparent Risk Signals.',
  supporting:
    'A Malawi-focused prototype using clearly identified synthetic ATM transactions.',
  student: 'Desire Chimtsitsi',
  version: '1.0.0-frontend',
  dataMode: 'SYNTHETIC MALAWI CSV · NO LIVE BANK CONNECTION',
}

/** Palette mirror for libraries (Recharts) that need raw colour values. */
export const CHART_COLORS = {
  brand: 'var(--color-brand)',
  brandSoft: 'color-mix(in srgb, var(--color-brand) 18%, transparent)',
  ok: 'var(--color-ok)',
  warn: 'var(--color-warn)',
  risk: 'var(--color-risk)',
  violet: 'var(--color-violet)',
  grid: 'var(--color-hairline)',
  axis: 'var(--color-dim)',
  tooltipBg: 'var(--color-panel)',
}

export const CHART_AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  tick: { fill: CHART_COLORS.axis, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.grid },
}

/**
 * Route + navigation registry. The header derives page titles/subtitles from
 * this single source of truth so navigation labels never drift from the UI.
 */
export const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'Malawi Transaction Overview',
    subtitle: 'Synthetic Malawi ATM transactions with precomputed Isolation Forest anomaly results.',
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    title: 'Transaction Explorer',
    subtitle: 'Search and inspect local demonstration ATM transactions.',
  },
  {
    to: '/anomalies',
    label: 'Anomaly Detection',
    icon: TriangleAlert,
    title: 'Flagged Anomalies',
    subtitle: 'Synthetic transactions flagged by Isolation Forest for anomaly review.',
  },
  {
    to: '/atm-network',
    label: 'ATM Network',
    icon: Network,
    title: 'ATM Network',
    subtitle: 'Synthetic transactions and model flags grouped by simulated ATM.',
  },
  {
    to: '/ml-model',
    label: 'ML Model',
    icon: BrainCircuit,
    title: 'Isolation Forest Model',
    subtitle: 'Precomputed unsupervised predictions from synthetic demonstration data.',
  },
  {
    to: '/analytics',
    label: 'Analytics / Reports',
    icon: BarChart3,
    title: 'Behavioural Analytics',
    subtitle: 'Simple trends and status summaries for the demonstration data.',
  },
  {
    to: '/reports',
    label: 'Download Report',
    icon: FileSpreadsheet,
    title: 'Download Report',
    subtitle: 'Download synthetic transactions and model predictions as CSV files.',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    title: 'Settings',
    subtitle: 'Prototype context, synthetic-data provenance and system information.',
  },
]

export const TRANSACTION_TYPES = [
  'Cash withdrawal',
  'Cardless withdrawal',
  'Deposit',
  'Balance inquiry',
  'Transfer',
]

export const RISK_LEVELS = ['low', 'medium', 'high']

export const ATM_STATUSES = ['active', 'warning', 'high-risk', 'offline']

export const ANOMALY_STATUSES = ['Flagged', 'Under Review', 'Cleared']

export const PAGE_SIZES = [10, 25, 50]

export const DEFAULT_PAGE_SIZE = 10

/** Header search surface — how many results each group shows in the dropdown. */
export const SEARCH_RESULT_LIMIT = 5
