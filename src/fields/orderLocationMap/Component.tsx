'use client'

import React, { useEffect, useRef, useState } from 'react'

type AddressData = {
  firstName?: string
  lastName?: string
  state?: string
  country?: string
  phone?: string
  nearbyLandmark?: string
  detailedDirections?: string
  coordinates?: {
    latitude?: number
    longitude?: number
    accuracy?: number
    source?: 'gps' | 'ip' | 'manual' | 'map'
    ip?: string
  }
}

type OrderLocationMapProps = {
  path: string
  label: string
  addressData: AddressData
  // Legacy props for backward compatibility
  latitude?: number
  longitude?: number
}

// Minimal Leaflet type definitions for what we use
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

// Extend Window interface to include Leaflet globals
declare global {
  interface Window {
    L: LeafletStatic
  }
}

// Source label and color mapping
const sourceConfig: Record<string, { label: string; color: string; icon: string }> = {
  gps: { label: 'GPS', color: '#22c55e', icon: '📍' },
  ip: { label: 'IP Address', color: '#f59e0b', icon: '🌐' },
  manual: { label: 'Manual Entry', color: '#6366f1', icon: '✏️' },
  map: { label: 'Map Selection', color: '#3b82f6', icon: '🗺️' },
}

export const OrderLocationMap: React.FC<OrderLocationMapProps> = ({
  label,
  addressData,
  latitude: legacyLatitude,
  longitude: legacyLongitude,
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const circleRef = useRef<LeafletCircle | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const initAttemptRef = useRef(0)

  // Use coordinates from addressData or fall back to legacy props
  const latitude = addressData?.coordinates?.latitude ?? legacyLatitude
  const longitude = addressData?.coordinates?.longitude ?? legacyLongitude
  const accuracy = addressData?.coordinates?.accuracy
  const source = addressData?.coordinates?.source
  const ip = addressData?.coordinates?.ip

  // Get source configuration
  const sourceInfo = source ? sourceConfig[source] : null

  // Build recipient name
  const recipientName = [addressData?.firstName, addressData?.lastName].filter(Boolean).join(' ')

  // Build location string
  const locationParts = [addressData?.state, addressData?.country].filter(Boolean)
  const locationString = locationParts.join(', ')

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Load Leaflet CSS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)
    }

    // Check if Leaflet is already loaded
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="leaflet.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setLeafletLoaded(true))
      // If script already loaded, window.L should exist
      if (window.L) {
        setLeafletLoaded(true)
      }
      return
    }

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    script.crossOrigin = ''
    script.async = true
    script.onload = () => setLeafletLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize map when Leaflet is loaded and we have coordinates
  useEffect(() => {
    if (!leafletLoaded || !latitude || !longitude) {
      return
    }

    // Increment attempt counter
    const currentAttempt = ++initAttemptRef.current

    // Function to try initializing the map
    const tryInitialize = () => {
      // Skip if a newer attempt was started
      if (currentAttempt !== initAttemptRef.current) {
        return
      }

      if (!mapRef.current || !window.L) {
        return
      }

      // Clean up existing map if it exists
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null
      }

      // Determine zoom level based on accuracy
      let zoomLevel = 15
      if (accuracy) {
        if (accuracy > 5000) zoomLevel = 12
        else if (accuracy > 1000) zoomLevel = 14
        else if (accuracy > 100) zoomLevel = 16
        else zoomLevel = 17
      }

      // Create the map
      const map = window.L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: zoomLevel,
        scrollWheelZoom: false,
      })

      mapInstanceRef.current = map

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add accuracy circle if available
      if (accuracy && accuracy > 0) {
        const circle = window.L.circle([latitude, longitude], {
          radius: accuracy,
          color: sourceInfo?.color || '#3b82f6',
          fillColor: sourceInfo?.color || '#3b82f6',
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map)

        circleRef.current = circle
      }

      // Add marker
      const marker = window.L.marker([latitude, longitude], {
        draggable: false,
      }).addTo(map)

      markerRef.current = marker

      // Build popup content
      const popupParts = []

      // Header with recipient name
      if (recipientName) {
        popupParts.push(
          `<div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${recipientName}</div>`,
        )
      }

      // Location
      if (locationString) {
        popupParts.push(
          `<div style="font-size: 13px; color: #374151; margin-bottom: 4px;">${locationString}</div>`,
        )
      }

      // Nearby landmark
      if (addressData?.nearbyLandmark) {
        popupParts.push(
          `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;"><strong>Landmark:</strong> ${addressData.nearbyLandmark}</div>`,
        )
      }

      // Phone
      if (addressData?.phone) {
        popupParts.push(
          `<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;"><strong>Phone:</strong> <a href="tel:${addressData.phone}" style="color: #3b82f6;">${addressData.phone}</a></div>`,
        )
      }

      // Detailed directions
      if (addressData?.detailedDirections) {
        popupParts.push(
          `<div style="font-size: 12px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;"><strong>Directions:</strong><br/>${addressData.detailedDirections}</div>`,
        )
      }

      // Source badge
      if (sourceInfo) {
        popupParts.push(`<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: ${sourceInfo.color}20; color: ${sourceInfo.color}; border-radius: 4px; font-size: 11px; font-weight: 500;">
            ${sourceInfo.icon} ${sourceInfo.label}
          </span>
          ${accuracy ? `<span style="font-size: 11px; color: #9ca3af;">~${accuracy >= 1000 ? (accuracy / 1000).toFixed(1) + 'km' : accuracy.toFixed(0) + 'm'} accuracy</span>` : ''}
        </div>`)
      }

      // Fallback if no data
      if (popupParts.length === 0) {
        popupParts.push(`<div style="font-weight: 600;">Delivery Location</div>`)
        popupParts.push(
          `<div style="font-size: 12px; color: #6b7280;">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</div>`,
        )
      }

      marker
        .bindPopup(`<div style="min-width: 200px; max-width: 280px;">${popupParts.join('')}</div>`)
        .openPopup()

      // Invalidate size multiple times with increasing delays to handle container sizing
      const delays = [0, 100, 300, 500, 1000]
      delays.forEach((delay) => {
        setTimeout(() => {
          if (mapInstanceRef.current && currentAttempt === initAttemptRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, delay)
      })
    }

    // Small delay to ensure the container is rendered
    const timeoutId = setTimeout(tryInitialize, 50)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [
    leafletLoaded,
    latitude,
    longitude,
    accuracy,
    source,
    recipientName,
    locationString,
    addressData?.nearbyLandmark,
    addressData?.phone,
    addressData?.detailedDirections,
    sourceInfo,
  ])

  // Cleanup on unmount
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
      markerRef.current = null
      circleRef.current = null
    }
  }, [])

  // If no coordinates, show a message
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
          No coordinates available for this order
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
        {/* Recipient and location */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {recipientName && (
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
              {recipientName}
            </div>
          )}
          {locationString && (
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{locationString}</div>
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
            {accuracy && (
              <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '4px' }}>
                (
                {accuracy >= 1000 ? (accuracy / 1000).toFixed(1) + 'km' : accuracy.toFixed(0) + 'm'}
                )
              </span>
            )}
          </div>
        )}

        {/* IP address if available */}
        {ip && (
          <div
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              fontFamily: 'monospace',
              backgroundColor: '#f3f4f6',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            IP: {ip}
          </div>
        )}
      </div>

      {/* Nearby landmark and directions */}
      {(addressData?.nearbyLandmark || addressData?.detailedDirections) && (
        <div
          style={{
            marginBottom: '12px',
            padding: '12px 16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fcd34d',
          }}
        >
          {addressData?.nearbyLandmark && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: addressData?.detailedDirections ? '8px' : 0,
              }}
            >
              <span style={{ fontSize: '14px' }}>📍</span>
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#92400e',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Nearby Landmark
                </div>
                <div style={{ fontSize: '13px', color: '#78350f' }}>
                  {addressData.nearbyLandmark}
                </div>
              </div>
            </div>
          )}
          {addressData?.detailedDirections && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🧭</span>
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#92400e',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Directions
                </div>
                <div style={{ fontSize: '13px', color: '#78350f', whiteSpace: 'pre-wrap' }}>
                  {addressData.detailedDirections}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '400px',
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

          {/* Phone link */}
          {addressData?.phone && (
            <a
              href={`tel:${addressData.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#dcfce7',
                color: '#166534',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
                border: '1px solid #bbf7d0',
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
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {addressData.phone}
            </a>
          )}
        </div>

        {/* External map links */}
        <div style={{ display: 'flex', gap: '8px' }}>
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
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6'
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
            Google Maps
          </a>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: '#10b981',
              color: 'white',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#059669'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981'
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
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
            Get Directions
          </a>
        </div>
      </div>
    </div>
  )
}
