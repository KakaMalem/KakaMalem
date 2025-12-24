'use client'

import React, { useEffect, useRef, useState } from 'react'

type LocationData = {
  coordinates?: [number, number] | null // [longitude, latitude] - Payload point format
  accuracy?: number | null
  country?: string | null
  countryCode?: string | null
  region?: string | null
  city?: string | null
  timezone?: string | null
  source?: 'browser' | 'ip' | 'manual' | null
  event?: 'login' | 'register' | 'order' | 'browser_permission' | 'verify_email' | 'oauth' | null
  ip?: string | null
  permissionGranted?: boolean
  lastUpdated?: string | null
}

type LocationHistoryEntry = {
  coordinates?: [number, number] | null
  city?: string | null
  country?: string | null
  source?: 'browser' | 'ip' | null
  event?: 'login' | 'register' | 'order' | 'browser_permission' | 'verify_email' | 'oauth' | null
  timestamp?: string | null
}

type UserLocationMapProps = {
  path: string
  label: string
  locationData: LocationData
  locationHistory?: LocationHistoryEntry[]
  userName?: string
}

// Minimal Leaflet type definitions
interface LeafletMap {
  remove: () => void
  invalidateSize: () => void
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker
  bindPopup: (content: string) => LeafletMarker
  openPopup: () => LeafletMarker
}

interface LeafletCircle {
  addTo: (map: LeafletMap) => LeafletCircle
}

interface LeafletStatic {
  map: (
    element: HTMLElement,
    options: { center: [number, number]; zoom: number; scrollWheelZoom: boolean },
  ) => LeafletMap
  tileLayer: (
    url: string,
    options: { attribution: string; maxZoom: number },
  ) => { addTo: (map: LeafletMap) => void }
  marker: (latlng: [number, number], options: { draggable: boolean }) => LeafletMarker
  circle: (
    latlng: [number, number],
    options: {
      radius: number
      color: string
      fillColor: string
      fillOpacity: number
      weight: number
    },
  ) => LeafletCircle
}

declare global {
  interface Window {
    L: LeafletStatic
  }
}

// Source configuration
const sourceConfig: Record<string, { label: string; color: string; icon: string }> = {
  browser: { label: 'Browser GPS', color: '#22c55e', icon: '📍' },
  ip: { label: 'IP Geolocation', color: '#f59e0b', icon: '🌐' },
  manual: { label: 'Manual Entry', color: '#6366f1', icon: '✏️' },
}

// Event configuration
const eventConfig: Record<string, { label: string; color: string; icon: string }> = {
  login: { label: 'Login', color: '#3b82f6', icon: '🔐' },
  register: { label: 'Registration', color: '#10b981', icon: '📝' },
  order: { label: 'Order Placed', color: '#8b5cf6', icon: '🛒' },
  browser_permission: { label: 'Browser Permission', color: '#22c55e', icon: '📍' },
  verify_email: { label: 'Email Verification', color: '#06b6d4', icon: '✉️' },
  oauth: { label: 'OAuth Login', color: '#f97316', icon: '🔗' },
}

export const UserLocationMap: React.FC<UserLocationMapProps> = ({
  label,
  locationData,
  locationHistory,
  userName,
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const initAttemptRef = useRef(0)

  // Extract coordinates from Payload's point format [longitude, latitude]
  const longitude = locationData?.coordinates?.[0]
  const latitude = locationData?.coordinates?.[1]
  const accuracy = locationData?.accuracy
  const source = locationData?.source
  const event = locationData?.event
  const ip = locationData?.ip
  const lastUpdated = locationData?.lastUpdated

  // Get configuration
  const sourceInfo = source ? sourceConfig[source] : null
  const eventInfo = event ? eventConfig[event] : null

  // Build location string
  const locationParts = [locationData?.city, locationData?.region, locationData?.country].filter(
    Boolean,
  )
  const locationString = locationParts.join(', ')

  // Load Leaflet
  useEffect(() => {
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src*="leaflet.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setLeafletLoaded(true))
      if (window.L) setLeafletLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    script.async = true
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !latitude || !longitude) return

    const currentAttempt = ++initAttemptRef.current

    const tryInitialize = () => {
      if (currentAttempt !== initAttemptRef.current) return
      if (!mapRef.current || !window.L) return

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null
      }

      // Determine zoom level based on accuracy
      let zoomLevel = 14
      if (accuracy) {
        if (accuracy > 5000) zoomLevel = 11
        else if (accuracy > 1000) zoomLevel = 13
        else if (accuracy > 100) zoomLevel = 15
        else zoomLevel = 16
      }

      const map = window.L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: zoomLevel,
        scrollWheelZoom: false,
      })

      mapInstanceRef.current = map

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add accuracy circle
      if (accuracy && accuracy > 0) {
        window.L.circle([latitude, longitude], {
          radius: accuracy,
          color: sourceInfo?.color || '#3b82f6',
          fillColor: sourceInfo?.color || '#3b82f6',
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map)
      }

      // Add marker
      const marker = window.L.marker([latitude, longitude], {
        draggable: false,
      }).addTo(map)

      // Build popup content
      const popupParts = []

      if (userName) {
        popupParts.push(
          `<div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${userName}</div>`,
        )
      }

      if (locationString) {
        popupParts.push(
          `<div style="font-size: 13px; color: #374151; margin-bottom: 8px;">${locationString}</div>`,
        )
      }

      // Source and event badges
      const badges = []
      if (sourceInfo) {
        badges.push(
          `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: ${sourceInfo.color}20; color: ${sourceInfo.color}; border-radius: 4px; font-size: 11px; font-weight: 500;">${sourceInfo.icon} ${sourceInfo.label}</span>`,
        )
      }
      if (eventInfo) {
        badges.push(
          `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: ${eventInfo.color}20; color: ${eventInfo.color}; border-radius: 4px; font-size: 11px; font-weight: 500;">${eventInfo.icon} ${eventInfo.label}</span>`,
        )
      }

      if (badges.length > 0) {
        popupParts.push(
          `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">${badges.join('')}</div>`,
        )
      }

      if (accuracy) {
        const accuracyText =
          accuracy >= 1000 ? (accuracy / 1000).toFixed(1) + 'km' : accuracy.toFixed(0) + 'm'
        popupParts.push(
          `<div style="font-size: 11px; color: #9ca3af;">Accuracy: ~${accuracyText}</div>`,
        )
      }

      if (popupParts.length === 0) {
        popupParts.push(`<div style="font-weight: 600;">User Location</div>`)
        popupParts.push(
          `<div style="font-size: 12px; color: #6b7280;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>`,
        )
      }

      marker
        .bindPopup(`<div style="min-width: 180px; max-width: 260px;">${popupParts.join('')}</div>`)
        .openPopup()

      // Invalidate size
      const delays = [0, 100, 300, 500, 1000]
      delays.forEach((delay) => {
        setTimeout(() => {
          if (mapInstanceRef.current && currentAttempt === initAttemptRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, delay)
      })
    }

    const timeoutId = setTimeout(tryInitialize, 50)
    return () => clearTimeout(timeoutId)
  }, [
    leafletLoaded,
    latitude,
    longitude,
    accuracy,
    source,
    event,
    userName,
    locationString,
    sourceInfo,
    eventInfo,
  ])

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  // No coordinates available
  if (!latitude || !longitude) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {label}
        </label>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          No location data available for this user
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '0.5rem',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        {label}
      </label>

      {/* Info bar above map */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
          padding: '12px 16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* Location info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {locationString && (
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
              {locationString}
            </div>
          )}
          {locationData?.timezone && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{locationData.timezone}</div>
          )}
        </div>

        {/* Source badge */}
        {sourceInfo && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: `${sourceInfo.color}15`,
              border: `1px solid ${sourceInfo.color}40`,
              borderRadius: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>{sourceInfo.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: sourceInfo.color }}>
              {sourceInfo.label}
            </span>
          </div>
        )}

        {/* Event badge */}
        {eventInfo && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: `${eventInfo.color}15`,
              border: `1px solid ${eventInfo.color}40`,
              borderRadius: '6px',
            }}
          >
            <span style={{ fontSize: '14px' }}>{eventInfo.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: eventInfo.color }}>
              {eventInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Permission and IP info */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {locationData?.permissionGranted && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#166534',
            }}
          >
            <span>✅</span>
            <span>Browser Permission Granted</span>
          </div>
        )}

        {ip && (
          <div
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: 'monospace',
              backgroundColor: '#f3f4f6',
              padding: '6px 10px',
              borderRadius: '4px',
            }}
          >
            IP: {ip}
          </div>
        )}

        {lastUpdated && (
          <div
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              padding: '6px 10px',
            }}
          >
            Updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        )}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '350px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '2px solid #e5e7eb',
        }}
      />

      {/* Footer with coordinates and actions */}
      <div
        style={{
          marginTop: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Coordinates */}
          <div
            style={{
              fontSize: '12px',
              color: '#6b7280',
              fontFamily: 'monospace',
              backgroundColor: '#f3f4f6',
              padding: '6px 10px',
              borderRadius: '4px',
            }}
          >
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>

          {/* Accuracy */}
          {accuracy && (
            <div
              style={{
                fontSize: '12px',
                color: '#6b7280',
                backgroundColor: '#fef3c7',
                padding: '6px 10px',
                borderRadius: '4px',
              }}
            >
              ~{accuracy >= 1000 ? (accuracy / 1000).toFixed(1) + 'km' : accuracy.toFixed(0) + 'm'}{' '}
              accuracy
            </div>
          )}
        </div>

        {/* External map link */}
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Open in Google Maps
        </a>
      </div>

      {/* Location History */}
      {locationHistory && locationHistory.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '10px',
            }}
          >
            Location History ({locationHistory.length} entries)
          </div>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            {locationHistory.map((entry, index) => {
              const entryEventInfo = entry.event ? eventConfig[entry.event] : null
              const entrySourceInfo = entry.source ? sourceConfig[entry.source] : null
              const entryLocation = [entry.city, entry.country].filter(Boolean).join(', ')

              return (
                <div
                  key={index}
                  style={{
                    padding: '10px 14px',
                    borderBottom: index < locationHistory.length - 1 ? '1px solid #e5e7eb' : 'none',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ fontSize: '13px', color: '#111827' }}>
                      {entryLocation || 'Unknown Location'}
                    </div>
                    {entry.timestamp && (
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {entryEventInfo && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        backgroundColor: `${entryEventInfo.color}15`,
                        color: entryEventInfo.color,
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {entryEventInfo.icon} {entryEventInfo.label}
                    </span>
                  )}

                  {entrySourceInfo && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        backgroundColor: `${entrySourceInfo.color}15`,
                        color: entrySourceInfo.color,
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {entrySourceInfo.icon} {entrySourceInfo.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
