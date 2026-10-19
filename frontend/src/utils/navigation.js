import { NAV_ITEMS } from './constants'

export function resolvePageMeta(pathname) {
  if (pathname.startsWith('/anomalies/')) {
    return {
      title: 'Anomaly Investigation',
      subtitle: 'Review a synthetic Malawi transaction flagged by the model; this is not a fraud verdict.',
    }
  }

  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.to))

  if (match) {
    return { title: match.title, subtitle: match.subtitle }
  }

  return {
    title: 'Page Not Found',
    subtitle: 'The requested route does not exist in this prototype.',
  }
}

export default resolvePageMeta
