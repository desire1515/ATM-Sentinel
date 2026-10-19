import { useEffect, useRef, useState } from 'react'
import { MapPin, RefreshCw, WifiOff } from 'lucide-react'
import L from 'leaflet'
import { MALAWI_CONTEXT } from '../../config/geography'
import { Card, CardHeader } from '../common/Card'
import { Button } from '../common/Button'

const MALAWI_CENTER = [-13.25, 34.3]
const OPEN_STREET_MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function createAtmIcon() {
  return L.divIcon({
    className: 'malawi-atm-marker-icon',
    html: '<span class="malawi-city-marker" aria-hidden="true"></span>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    tooltipAnchor: [7, -6],
  })
}

function createAtmPopup(atm) {
  const container = L.DomUtil.create('div', 'malawi-city-popup')
  const heading = L.DomUtil.create('strong', '', container)
  heading.textContent = `${atm.id} · ${atm.city}`

  const note = L.DomUtil.create('p', '', container)
  note.textContent = 'Synthetic demonstration coordinates; not a verified ATM site.'

  const coordinates = L.DomUtil.create('p', '', container)
  coordinates.textContent = `${atm.latitude}, ${atm.longitude}`
  return container
}

/**
 * Maps generated ATM coordinate rows. Coordinates are synthetic and do not
 * represent actual installations.
 */
export function MalawiCityPanel({ atms = [] }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
  const tileStateRef = useRef({ hasLoadedTile: false, tileErrors: 0 })
  const [tileState, setTileState] = useState({ status: 'loading', failedTiles: 0 })
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const mapElement = mapElementRef.current
    if (!mapElement) return undefined

    const map = L.map(mapElement, {
      center: MALAWI_CENTER,
      zoom: 6,
      minZoom: 5,
      maxZoom: 13,
      scrollWheelZoom: false,
      zoomControl: true,
      keyboard: true,
    })
    mapRef.current = map

    const tiles = L.tileLayer(OPEN_STREET_MAP_TILE_URL, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      maxZoom: 19,
      crossOrigin: true,
    })
    tileLayerRef.current = tiles
    tileStateRef.current = { hasLoadedTile: false, tileErrors: 0 }
    setTileState({
      status: navigator.onLine ? 'loading' : 'offline',
      failedTiles: 0,
    })

    const onTileLoad = () => {
      tileStateRef.current.hasLoadedTile = true
      setTileState({
        status: navigator.onLine ? 'ready' : 'offline',
        failedTiles: tileStateRef.current.tileErrors,
      })
    }
    const onTileLoading = () => {
      tileStateRef.current = { hasLoadedTile: false, tileErrors: 0 }
      setTileState({ status: navigator.onLine ? 'loading' : 'offline', failedTiles: 0 })
    }
    const onTileError = () => {
      tileStateRef.current.tileErrors += 1
      if (!tileStateRef.current.hasLoadedTile) {
        setTileState({
          status: navigator.onLine ? 'loading' : 'offline',
          failedTiles: tileStateRef.current.tileErrors,
        })
      } else {
        setTileState({
          status: navigator.onLine ? 'partial' : 'offline',
          failedTiles: tileStateRef.current.tileErrors,
        })
      }
    }
    const onTilesSettled = () => {
      if (tileStateRef.current.hasLoadedTile) {
        setTileState({
          status: navigator.onLine && tileStateRef.current.tileErrors ? 'partial' : navigator.onLine ? 'ready' : 'offline',
          failedTiles: tileStateRef.current.tileErrors,
        })
      } else {
        setTileState({
          status: navigator.onLine ? 'error' : 'offline',
          failedTiles: tileStateRef.current.tileErrors,
        })
      }
    }
    const onOffline = () => setTileState((current) => ({ ...current, status: 'offline' }))
    const onOnline = () => {
      tileStateRef.current = { hasLoadedTile: false, tileErrors: 0 }
      setTileState({ status: 'loading', failedTiles: 0 })
      tiles.redraw()
    }

    tiles.on('tileload', onTileLoad)
    tiles.on('loading', onTileLoading)
    tiles.on('tileerror', onTileError)
    tiles.on('load', onTilesSettled)
    tiles.addTo(map)

    atms.forEach((atm) => {
      const label = `${atm.id} in ${atm.city}. Synthetic location; not a verified ATM.`
      const marker = L.marker([atm.latitude, atm.longitude], {
        alt: label,
        icon: createAtmIcon(),
        keyboard: true,
        title: label,
      })
        .bindTooltip(atm.id, {
          direction: 'top',
          permanent: false,
          className: 'malawi-city-tooltip',
        })
        .bindPopup(createAtmPopup(atm))
        .addTo(map)
      marker.getElement()?.setAttribute('aria-label', label)
    })
    if (atms.length) {
      const bounds = L.latLngBounds(atms.map((atm) => [atm.latitude, atm.longitude]))
      map.fitBounds(bounds.pad(0.12), { maxZoom: 7 })
    }

    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      tiles.off('tileload', onTileLoad)
      tiles.off('loading', onTileLoading)
      tiles.off('tileerror', onTileError)
      tiles.off('load', onTilesSettled)
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
    }
  }, [atms, retryKey])

  const retryTiles = () => {
    if (mapRef.current && tileLayerRef.current) {
      tileStateRef.current = { hasLoadedTile: false, tileErrors: 0 }
      setTileState({ status: navigator.onLine ? 'loading' : 'offline', failedTiles: 0 })
      tileLayerRef.current.redraw()
      return
    }
    setRetryKey((key) => key + 1)
  }

  const hasTileWarning = ['error', 'offline', 'partial'].includes(tileState.status)

  return (
    <Card>
      <CardHeader
        title={`${MALAWI_CONTEXT.country} synthetic ATM locations`}
        description="Generated coordinates from the synthetic dataset, overlaid on OpenStreetMap for geographic context. No marker represents a verified installation."
        icon={MapPin}
      />

      <div className="relative mt-4 overflow-hidden rounded-xl border border-hairline bg-ink-soft/60">
        <div
          ref={mapElementRef}
          className="malawi-leaflet-map h-[min(68vh,560px)] min-h-[340px] w-full sm:min-h-[420px]"
          role="region"
          aria-label={`Interactive OpenStreetMap with ${atms.length} simulated Malawi ATM points. Coordinates are synthetic.`}
        />

        {tileState.status === 'loading' ? (
          <div role="status" className="absolute left-3 top-3 z-[1000] rounded-lg border border-hairline bg-panel/95 px-3 py-2 text-xs text-body shadow-panel">
            Loading OpenStreetMap tiles…
          </div>
        ) : null}

        {hasTileWarning ? (
          <div
            role={tileState.status === 'partial' ? 'status' : 'alert'}
            className="absolute left-3 right-3 top-3 z-[1000] rounded-lg border border-warn/50 bg-panel/95 p-3 shadow-panel sm:right-auto sm:max-w-md"
          >
            <div className="flex items-start gap-2">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-body">
                  {tileState.status === 'offline'
                    ? 'Map tiles unavailable while offline'
                    : tileState.status === 'partial'
                      ? 'Some map tiles could not be loaded'
                      : 'OpenStreetMap tiles could not be loaded'}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-muted">
                  Synthetic coordinate records remain available in the terminal list. The tile
                  service requires an internet connection; retry the map if needed.
                </p>
                {tileState.failedTiles ? (
                  <p className="mt-1 text-[10px] text-dim">
                    Failed tile requests: {tileState.failedTiles}
                  </p>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  onClick={retryTiles}
                  className="mt-2"
                >
                  Retry map tiles
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted">
        Simulated points shown: <span className="font-semibold text-body">{atms.length}</span>
      </p>
      <p className="mt-3 border-t border-hairline/70 pt-3 text-[11px] leading-5 text-dim">
        Marker positions are generated from synthetic coordinates near simulated town locations.
        They do not identify verified ATM installations or real financial infrastructure.
        OpenStreetMap tiles are an external service and may be unavailable offline or rate-limited.
      </p>
    </Card>
  )
}

export default MalawiCityPanel
