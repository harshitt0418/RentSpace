/**
 * LocationPicker.jsx — Auto-detect + interactive map for choosing a location
 * Uses browser Geolocation API + OpenStreetMap Nominatim (free, no API key)
 * and Leaflet for the interactive map.
 */
import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ── Reverse geocode via OpenStreetMap Nominatim ───────────────────── */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const a = data.address || {}
    const city = a.city || a.town || a.village || a.county || a.state_district || ''
    const state = a.state || ''
    const fullAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    return { city, state, address: fullAddress }
  } catch {
    return { city: '', state: '', address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
  }
}

/* ── Sub-component: click on map to set marker ─────────────────────── */
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/* ── Sub-component: fly to a position ──────────────────────────────── */
function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 })
  }, [center, map])
  return null
}

/* ── Main Component ────────────────────────────────────────────────── */
export default function LocationPicker({ value, onChange, error }) {
  const [showMap, setShowMap] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [coords, setCoords] = useState(null) // { lat, lng }
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]) // default: India center

  // Detect current location
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        setMapCenter([lat, lng])
        const geo = await reverseGeocode(lat, lng)
        onChange(geo.city, geo.state, [lng, lat], geo.address)
        setDetecting(false)
        setShowMap(true)
      },
      (err) => {
        console.error('Geolocation error:', err.message)
        alert('Could not detect location. Please allow location access or pick on the map.')
        setDetecting(false)
        setShowMap(true) // open map as fallback
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [onChange])

  // When user clicks on the map
  const handleMapClick = useCallback(async (lat, lng) => {
    setCoords({ lat, lng })
    const geo = await reverseGeocode(lat, lng)
    onChange(geo.city, geo.state, [lng, lat], geo.address)
  }, [onChange])

  return (
    <div>
      {/* Location display + action buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <div
          className="form-input"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            color: value ? 'var(--text)' : 'var(--text-3)',
            cursor: 'default',
            minHeight: 42,
            ...(error ? { borderColor: 'var(--danger)' } : {}),
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value || 'Select location from map or detect'}
          </span>
        </div>
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
            padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
            opacity: detecting ? 0.7 : 1,
          }}
          title="Detect my location"
        >
          {detecting ? '⏳ Detecting…' : '📍 Detect'}
        </button>
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          style={{
            background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
          }}
          title="Pick on map"
        >
          🗺️ Map
        </button>
      </div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{error}</div>}

      {/* Map */}
      {showMap && (
        <div style={{
          marginTop: 10, borderRadius: 12, overflow: 'hidden',
          border: '1px solid var(--border)', height: 260,
        }}>
          <MapContainer
            center={mapCenter}
            zoom={coords ? 14 : 5}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleMapClick} />
            <FlyTo center={coords ? [coords.lat, coords.lng] : null} />
            {coords && <Marker position={[coords.lat, coords.lng]} />}
          </MapContainer>
          <div style={{
            fontSize: 11, color: 'var(--text-3)', padding: '6px 10px',
            background: 'var(--surface-2)', textAlign: 'center',
          }}>
            Click on the map to pick a precise location
          </div>
        </div>
      )}
    </div>
  )
}
