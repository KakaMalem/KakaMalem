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

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  source: 'gps' | 'ip' | 'manual' | 'map'
  ip?: string
}

interface LocationPickerProps {
  latitude?: number
  longitude?: number
  onLocationSelect: (locationData: LocationData) => void
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
  const [clientIP, setClientIP] = useState<string | undefined>(undefined)

  useEffect(() => {
    setSelectedLat(latitude)
    setSelectedLng(longitude)
  }, [latitude, longitude])

  // Fetch client IP on mount
  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const data = await response.json()
        setClientIP(data.ip)
      } catch (error) {
        console.warn('Could not fetch IP address:', error)
      }
    }
    fetchIP()
  }, [])

  const getCurrentLocation = () => {
    setGettingLocation(true)
    setError(null)

    // Check if the site is served over HTTPS (required for mobile devices)
    const isSecureContext = window.isSecureContext
    if (!isSecureContext && window.location.hostname !== 'localhost') {
      setError(
        'دسترسی به موقعیت به اتصال HTTPS نیاز دارد. لطفاً از HTTPS استفاده کنید یا ورود دستی را امتحان کنید.',
      )
      setGettingLocation(false)
      return
    }

    if (!navigator.geolocation) {
      setError('موقعیت‌یابی جغرافیایی توسط مرورگر شما پشتیبانی نمی‌شود')
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

        // Pass complete location data with metadata
        onLocationSelect({
          latitude: lat,
          longitude: lng,
          accuracy: locationAccuracy,
          source: 'gps',
          ip: clientIP,
        })
        setGettingLocation(false)

        // Show accuracy feedback
        if (locationAccuracy < 50) {
          console.log('GPS location obtained with high accuracy:', locationAccuracy, 'meters')
        } else {
          console.log('GPS location obtained with accuracy:', locationAccuracy, 'meters')
        }
      },
      (error) => {
        let errorMessage = 'دریافت موقعیت شما ممکن نیست. '

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              'لطفاً دسترسی به موقعیت را در تنظیمات مرورگر/دستگاه خود مجاز کنید. در موبایل، هم دسترسی مرورگر و هم دسترسی دستگاه را بررسی کنید.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage +=
              'سیگنال GPS در دسترس نیست. مطمئن شوید که موقعیت در دستگاه شما فعال است، به منطقه باز بروید یا از ورود دستی استفاده کنید.'
            break
          case error.TIMEOUT:
            errorMessage +=
              'درخواست GPS زمان‌بندی شد. بررسی کنید که موقعیت در دستگاه شما فعال است، سپس دوباره امتحان کنید یا از ورود دستی استفاده کنید.'
            break
          default:
            errorMessage +=
              'لطفاً مجوزهای موقعیت مرورگر و دستگاه خود را بررسی کنید، مطمئن شوید که GPS/موقعیت فعال است.'
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

  const openGoogleMapsForSelection = () => {
    const currentLat = selectedLat || 34.542693 // Default to Kabul if no location
    const currentLng = selectedLng || 69.169697

    // Open Google Maps with a pin at the location
    window.open(`https://www.google.com/maps?q=${currentLat},${currentLng}`, '_blank')
  }

  const handleMapLocationSelect = (lat: number, lng: number) => {
    setSelectedLat(lat)
    setSelectedLng(lng)
    setAccuracy(undefined) // Clear accuracy when manually selecting on map

    // Pass complete location data with map source
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      accuracy: undefined,
      source: 'map',
      ip: clientIP,
    })
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        {selectedLat && selectedLng && (
          <button type="button" onClick={clearLocation} className="btn btn-ghost btn-xs text-error">
            <X className="w-3 h-3" />
            پاک کردن
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
          برای تنظیم موقعیت تحویل، روی نقشه کلیک کنید
          {accuracy && (
            <span className="text-primary ml-1">• دقت GPS: ±{Math.round(accuracy)}m</span>
          )}
        </p>
      </div>

      {selectedLat && selectedLng ? (
        <div className="alert alert-success">
          <Check className="w-5 h-5" />
          <div className="flex-1">
            <div className="text-sm font-medium">موقعیت انتخاب شد</div>
            <div className="text-xs opacity-80">
              {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning">
          <MapPin className="w-5 h-5" />
          <div className="text-sm">
            موقعیت دقیق خود را پین کنید تا تیم ارسال راحت‌تر شما را پیدا کند
          </div>
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
          className="btn btn-primary gap-2"
        >
          {gettingLocation ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              در حال دریافت موقعیت...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              استفاده از موقعیت فعلی من
            </>
          )}
        </button>

        <button type="button" onClick={openGoogleMapsForSelection} className="btn btn-soft gap-2">
          <MapPin className="w-4 h-4" />
          باز کردن گوگل مپ
        </button>
      </div>
    </div>
  )
}
