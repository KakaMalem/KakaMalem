'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Check, X } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import InteractiveMap with SSR disabled (Leaflet requires window)
const InteractiveMap = dynamic(() => import('./InteractiveMap').then((mod) => mod.InteractiveMap), {
  ssr: false,
  loading: () => (
    <div
      className="bg-base-200 rounded-lg flex items-center justify-center border-2 border-base-300"
      style={{ height: '350px' }}
    >
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  ),
})

interface LocationPickerProps {
  latitude?: number
  longitude?: number
  onLocationSelect: (lat: number, lng: number) => void
  className?: string
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  className = '',
}) => {
  const [selectedLat, setSelectedLat] = useState<number | undefined>(latitude)
  const [selectedLng, setSelectedLng] = useState<number | undefined>(longitude)
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedLat(latitude)
    setSelectedLng(longitude)
  }, [latitude, longitude])

  const getCurrentLocation = () => {
    setGettingLocation(true)
    setError(null)

    // Check if the site is served over HTTPS (required for mobile devices)
    const isSecureContext = window.isSecureContext
    if (!isSecureContext && window.location.hostname !== 'localhost') {
      setError(
        'Location access requires HTTPS connection. Please use HTTPS or try manual entry below.',
      )
      setGettingLocation(false)
      return
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setGettingLocation(false)
      return
    }

    // Request high-accuracy GPS position (bypasses IP-based location)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const locationAccuracy = position.coords.accuracy

        setSelectedLat(lat)
        setSelectedLng(lng)
        setAccuracy(locationAccuracy)
        onLocationSelect(lat, lng)
        setGettingLocation(false)

        // Show accuracy feedback
        if (locationAccuracy < 50) {
          console.log('GPS location obtained with high accuracy:', locationAccuracy, 'meters')
        } else {
          console.log('GPS location obtained with accuracy:', locationAccuracy, 'meters')
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location. '

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              'Please allow location access in your browser/device settings. On mobile, check both browser and device location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage +=
              'GPS signal not available. Make sure location is enabled on your device, try moving to an open area, or use manual entry below.'
            break
          case error.TIMEOUT:
            errorMessage +=
              'GPS request timed out. Check that location is enabled on your device, then try again or use manual entry below.'
            break
          default:
            errorMessage +=
              'Please check your browser and device location permissions, ensure GPS/location is enabled.'
        }

        setError(errorMessage)
        console.error('Geolocation error:', error)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true, // Forces GPS usage over IP-based location
        timeout: 30000, // Increased timeout for GPS to acquire signal
        maximumAge: 0, // Always get fresh position, don't use cached
      },
    )
  }

  const clearLocation = () => {
    setSelectedLat(undefined)
    setSelectedLng(undefined)
    setAccuracy(undefined)
    setError(null)
  }

  const openInGoogleMaps = () => {
    if (selectedLat && selectedLng) {
      window.open(`https://www.google.com/maps?q=${selectedLat},${selectedLng}`, '_blank')
    }
  }

  const openGoogleMapsForSelection = () => {
    const currentLat = selectedLat || 34.5553 // Default to Kabul if no location
    const currentLng = selectedLng || 69.2075

    // Open Google Maps with a pin at the location
    window.open(`https://www.google.com/maps?q=${currentLat},${currentLng}`, '_blank')
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setSelectedLat(lat)
    setSelectedLng(lng)
    setAccuracy(undefined) // Clear accuracy when manually selecting on map
    onLocationSelect(lat, lng)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="label">
          <span className="label-text font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            GPS Location
          </span>
        </label>
        {selectedLat && selectedLng && (
          <button type="button" onClick={clearLocation} className="btn btn-ghost btn-xs text-error">
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Interactive Map */}
      <div className="mb-3">
        <InteractiveMap
          latitude={selectedLat}
          longitude={selectedLng}
          accuracy={accuracy}
          onLocationSelect={handleMapLocationSelect}
          height="350px"
        />
        <p className="text-xs text-base-content/60 mt-2">
          Click anywhere on the map to set your delivery location
          {accuracy && (
            <span className="text-primary ml-1">• GPS accuracy: ±{Math.round(accuracy)}m</span>
          )}
        </p>
      </div>

      {selectedLat && selectedLng ? (
        <div className="alert alert-success">
          <Check className="w-5 h-5" />
          <div className="flex-1">
            <div className="text-sm font-medium">Location Selected</div>
            <div className="text-xs opacity-80">
              {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
            </div>
          </div>
          <button type="button" onClick={openInGoogleMaps} className="btn btn-sm btn-ghost">
            View on Map
          </button>
        </div>
      ) : (
        <div className="alert">
          <MapPin className="w-5 h-5" />
          <div className="text-sm">Pin your exact location to help delivery find you easily</div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <X className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation}
          className="btn btn-primary btn-sm gap-2"
        >
          {gettingLocation ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Getting Location...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              Use My Current Location
            </>
          )}
        </button>

        <button
          type="button"
          onClick={openGoogleMapsForSelection}
          className="btn btn-outline btn-sm gap-2"
        >
          <MapPin className="w-4 h-4" />
          Open Google Maps
        </button>
      </div>

      <div className="text-xs opacity-60 bg-base-200 p-3 rounded-lg">
        <strong>How to set location:</strong>
        <ol className="list-decimal list-inside mt-1 space-y-1">
          <li>
            <strong>Click on Map:</strong> Simply click your location on the map above
          </li>
          <li>
            <strong>Use GPS (Quick):</strong> Click "Use My Current Location" button
          </li>
          <li>
            <strong>Mobile Users:</strong> Make sure location/GPS is enabled in device settings for
            GPS button
          </li>
          <li>
            <strong>Manual Entry:</strong> Enter coordinates manually below if needed
          </li>
        </ol>
        <div className="alert alert-info text-xs mt-2 py-2">
          <span>
            <strong>Tip:</strong> Zoom in on the map for precise location selection. The marker
            shows where delivery will be sent.
          </span>
        </div>
      </div>

      {/* Manual coordinate entry */}
      <details className="collapse collapse-arrow bg-base-200">
        <summary className="collapse-title text-sm font-medium">Enter Coordinates Manually</summary>
        <div className="collapse-content">
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Latitude</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={selectedLat || ''}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value)
                  if (!isNaN(lat)) {
                    setSelectedLat(lat)
                    if (selectedLng) {
                      onLocationSelect(lat, selectedLng)
                    }
                  }
                }}
                placeholder="34.555300"
                className="input input-bordered input-sm"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Longitude</span>
              </label>
              <input
                type="number"
                step="0.000001"
                value={selectedLng || ''}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value)
                  if (!isNaN(lng)) {
                    setSelectedLng(lng)
                    if (selectedLat) {
                      onLocationSelect(selectedLat, lng)
                    }
                  }
                }}
                placeholder="69.207500"
                className="input input-bordered input-sm"
              />
            </div>
          </div>
        </div>
      </details>
    </div>
  )
}
