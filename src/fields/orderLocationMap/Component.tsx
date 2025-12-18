'use client'

import React, { useEffect, useRef, useState } from 'react'

type OrderLocationMapProps = {
  path: string
  label: string
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
}

// Extend Window interface to include Leaflet globals
declare global {
  interface Window {
    L: LeafletStatic
  }
}

export const OrderLocationMap: React.FC<OrderLocationMapProps> = ({
  label,
  latitude,
  longitude,
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const initAttemptRef = useRef(0)

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

      // Create the map
      const map = window.L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: false,
      })

      mapInstanceRef.current = map

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add marker
      const marker = window.L.marker([latitude, longitude], {
        draggable: false,
      }).addTo(map)

      markerRef.current = marker

      // Add popup
      marker.bindPopup(`<b>Delivery Location</b><br>${latitude}, ${longitude}`).openPopup()

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
  }, [leafletLoaded, latitude, longitude])

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
          No coordinates available
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
      <div
        style={{
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '14px',
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
            width="16"
            height="16"
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
    </div>
  )
}
