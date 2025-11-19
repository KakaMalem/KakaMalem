'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Leaflet with webpack
import L from 'leaflet'
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface InteractiveMapProps {
  latitude?: number
  longitude?: number
  accuracy?: number
  onLocationSelect: (lat: number, lng: number) => void
  height?: string
}

// Component to handle map clicks and update marker
function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLngExpression | null
  setPosition: (pos: LatLngExpression) => void
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  return position === null ? null : <Marker position={position} />
}

// Component to recenter map when position changes externally
function RecenterMap({ position }: { position: LatLngExpression }) {
  const map = useMap()
  useEffect(() => {
    map.setView(position, map.getZoom())
  }, [position, map])
  return null
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  accuracy,
  onLocationSelect,
  height = '400px',
}) => {
  // Default to Kabul, Afghanistan if no coordinates provided
  const defaultPosition: LatLngExpression = [34.5553, 69.2075]
  const initialPosition: LatLngExpression =
    latitude && longitude ? [latitude, longitude] : defaultPosition

  const [position, setPosition] = useState<LatLngExpression | null>(
    latitude && longitude ? [latitude, longitude] : null,
  )
  const [isMounted, setIsMounted] = useState(false)

  // Only render map on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude])
    }
  }, [latitude, longitude])

  const handlePositionChange = (pos: LatLngExpression) => {
    setPosition(pos)
    const [lat, lng] = pos as [number, number]
    onLocationSelect(lat, lng)
  }

  // Don't render map on server side (prevents hydration issues)
  if (!isMounted) {
    return (
      <div className="bg-base-200 rounded-lg flex items-center justify-center" style={{ height }}>
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border-2 border-base-300" style={{ height }}>
      <MapContainer
        center={initialPosition}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={handlePositionChange} />
        {position && accuracy && (
          <Circle
            center={position}
            radius={accuracy}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
        )}
        {position && <RecenterMap position={position} />}
      </MapContainer>
    </div>
  )
}
