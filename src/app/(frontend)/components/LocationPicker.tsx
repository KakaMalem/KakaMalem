'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MapPin, Navigation, Check, X, Globe, AlertTriangle } from 'lucide-react'
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

interface IpLocationData {
  latitude: number
  longitude: number
  city?: string
  country?: string
  ip: string
}

interface LocationPickerProps {
  latitude?: number
  longitude?: number
  onLocationSelect: (locationData: LocationData) => void
  className?: string
  /** If true, will automatically try to get location on mount */
  autoDetect?: boolean
  /** If true, coordinates are required and IP fallback will be used */
  required?: boolean
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  className = '',
  autoDetect = false,
  required = false,
}) => {
  const [selectedLat, setSelectedLat] = useState<number | undefined>(latitude)
  const [selectedLng, setSelectedLng] = useState<number | undefined>(longitude)
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined)
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'map' | undefined>(undefined)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [gettingIpLocation, setGettingIpLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientIP, setClientIP] = useState<string | undefined>(undefined)
  const [ipLocationData, setIpLocationData] = useState<IpLocationData | null>(null)
  const [hasAttemptedAutoDetect, setHasAttemptedAutoDetect] = useState(false)

  useEffect(() => {
    setSelectedLat(latitude)
    setSelectedLng(longitude)
  }, [latitude, longitude])

  // Fetch IP geolocation data
  const fetchIpLocation = useCallback(async (): Promise<IpLocationData | null> => {
    try {
      // Try ip-api.com first (free, no API key needed)
      const response = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city,country,query')
      const data = await response.json()

      if (data.status === 'success' && data.lat && data.lon) {
        return {
          latitude: data.lat,
          longitude: data.lon,
          city: data.city,
          country: data.country,
          ip: data.query,
        }
      }

      // Fallback to ipapi.co
      const fallbackResponse = await fetch('https://ipapi.co/json/')
      const fallbackData = await fallbackResponse.json()

      if (fallbackData.latitude && fallbackData.longitude) {
        return {
          latitude: fallbackData.latitude,
          longitude: fallbackData.longitude,
          city: fallbackData.city,
          country: fallbackData.country_name,
          ip: fallbackData.ip,
        }
      }

      return null
    } catch (err) {
      console.error('Failed to fetch IP location:', err)
      return null
    }
  }, [])

  // Apply IP-based location
  const applyIpLocation = useCallback(
    (ipData: IpLocationData) => {
      setSelectedLat(ipData.latitude)
      setSelectedLng(ipData.longitude)
      setAccuracy(undefined) // IP location doesn't have accuracy
      setLocationSource('ip')

      onLocationSelect({
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        accuracy: undefined,
        source: 'ip',
        ip: ipData.ip,
      })
    },
    [onLocationSelect],
  )

  // Try GPS, fall back to IP if GPS fails
  const tryGpsWithIpFallback = useCallback(
    (ipData: IpLocationData | null) => {
      if (!navigator.geolocation) {
        // No geolocation support, use IP fallback directly
        if (ipData) {
          applyIpLocation(ipData)
        }
        return
      }

      setGettingLocation(true)
      setError(null)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const locationAccuracy = position.coords.accuracy

          setSelectedLat(lat)
          setSelectedLng(lng)
          setAccuracy(locationAccuracy)
          setLocationSource('gps')

          onLocationSelect({
            latitude: lat,
            longitude: lng,
            accuracy: locationAccuracy,
            source: 'gps',
            ip: ipData?.ip || clientIP,
          })
          setGettingLocation(false)
        },
        () => {
          // GPS failed, use IP fallback
          setGettingLocation(false)
          if (ipData) {
            applyIpLocation(ipData)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Shorter timeout for auto-detect
          maximumAge: 60000,
        },
      )
    },
    [clientIP, onLocationSelect, applyIpLocation],
  )

  // Fetch client IP on mount and optionally auto-detect location
  useEffect(() => {
    const init = async () => {
      // Fetch IP location data (for fallback and display)
      const ipData = await fetchIpLocation()
      if (ipData) {
        setClientIP(ipData.ip)
        setIpLocationData(ipData)

        // Auto-detect: if required and no location set, use IP as initial fallback
        if (autoDetect && required && !latitude && !longitude && !hasAttemptedAutoDetect) {
          setHasAttemptedAutoDetect(true)
          // Try GPS first, fall back to IP
          tryGpsWithIpFallback(ipData)
        }
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get location from IP (manual trigger)
  const getLocationFromIP = async () => {
    setGettingIpLocation(true)
    setError(null)

    const ipData = ipLocationData || (await fetchIpLocation())
    if (ipData) {
      applyIpLocation(ipData)
      setIpLocationData(ipData)
    } else {
      setError('دریافت موقعیت از IP ممکن نشد. لطفاً موقعیت را روی نقشه انتخاب کنید.')
    }

    setGettingIpLocation(false)
  }

  const getCurrentLocation = async () => {
    setGettingLocation(true)
    setError(null)

    // Check if the site is served over HTTPS (required for mobile devices)
    const isSecureContext = window.isSecureContext
    if (!isSecureContext && window.location.hostname !== 'localhost') {
      // Fall back to IP location on non-HTTPS
      if (ipLocationData) {
        applyIpLocation(ipLocationData)
        setError('اتصال HTTPS نیست. موقعیت تقریبی از IP استفاده شد.')
      } else {
        setError(
          'دسترسی به موقعیت به اتصال HTTPS نیاز دارد. لطفاً از HTTPS استفاده کنید یا ورود دستی را امتحان کنید.',
        )
      }
      setGettingLocation(false)
      return
    }

    if (!navigator.geolocation) {
      // Fall back to IP location if geolocation not supported
      if (ipLocationData) {
        applyIpLocation(ipLocationData)
        setError('GPS پشتیبانی نمی‌شود. موقعیت تقریبی از IP استفاده شد.')
      } else {
        setError('موقعیت‌یابی جغرافیایی توسط مرورگر شما پشتیبانی نمی‌شود')
      }
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
        setLocationSource('gps')

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
      async (geoError) => {
        console.error('Geolocation error:', geoError)

        // Try IP fallback when GPS fails
        const ipData = ipLocationData || (await fetchIpLocation())
        if (ipData) {
          applyIpLocation(ipData)
          setIpLocationData(ipData)

          // Show warning that IP location was used
          let warningMessage = 'موقعیت GPS در دسترس نیست. '
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              warningMessage += 'دسترسی رد شد - '
              break
            case geoError.POSITION_UNAVAILABLE:
              warningMessage += 'GPS غیرفعال است - '
              break
            case geoError.TIMEOUT:
              warningMessage += 'زمان GPS تمام شد - '
              break
          }
          warningMessage += 'موقعیت تقریبی از IP استفاده شد. برای دقت بیشتر، موقعیت را روی نقشه تنظیم کنید.'
          setError(warningMessage)
        } else {
          // No IP fallback available
          let errorMessage = 'دریافت موقعیت شما ممکن نیست. '

          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage +=
                'لطفاً دسترسی به موقعیت را در تنظیمات مرورگر/دستگاه خود مجاز کنید.'
              break
            case geoError.POSITION_UNAVAILABLE:
              errorMessage +=
                'سیگنال GPS در دسترس نیست. مطمئن شوید که موقعیت در دستگاه شما فعال است.'
              break
            case geoError.TIMEOUT:
              errorMessage += 'درخواست GPS زمان‌بندی شد. دوباره امتحان کنید.'
              break
            default:
              errorMessage += 'لطفاً موقعیت را روی نقشه انتخاب کنید.'
          }

          setError(errorMessage)
        }
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true, // Forces GPS usage over IP-based location
        timeout: 15000, // 15 seconds timeout
        maximumAge: 60000, // Accept cached position up to 1 minute old
      },
    )
  }

  const clearLocation = () => {
    setSelectedLat(undefined)
    setSelectedLng(undefined)
    setAccuracy(undefined)
    setLocationSource(undefined)
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
    setLocationSource('map')
    setError(null) // Clear any previous errors

    // Pass complete location data with map source
    onLocationSelect({
      latitude: lat,
      longitude: lng,
      accuracy: undefined,
      source: 'map',
      ip: clientIP,
    })
  }

  // Get source label for display
  const getSourceLabel = () => {
    switch (locationSource) {
      case 'gps':
        return { text: 'GPS دقیق', color: 'text-success', icon: '📍' }
      case 'ip':
        return { text: 'تقریبی (IP)', color: 'text-warning', icon: '🌐' }
      case 'map':
        return { text: 'انتخاب روی نقشه', color: 'text-info', icon: '🗺️' }
      default:
        return null
    }
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
        <div className={`alert ${locationSource === 'ip' ? 'alert-warning' : 'alert-success'}`}>
          {locationSource === 'ip' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Check className="w-5 h-5" />
          )}
          <div className="flex-1">
            <div className="text-sm font-medium flex items-center gap-2">
              موقعیت انتخاب شد
              {getSourceLabel() && (
                <span className={`badge badge-sm ${getSourceLabel()?.color}`}>
                  {getSourceLabel()?.icon} {getSourceLabel()?.text}
                </span>
              )}
            </div>
            <div className="text-xs opacity-80">
              {selectedLat.toFixed(6)}, {selectedLng.toFixed(6)}
              {accuracy && <span className="ml-2">• دقت: ±{Math.round(accuracy)}m</span>}
            </div>
            {locationSource === 'ip' && (
              <div className="text-xs mt-1 opacity-70">
                برای دقت بیشتر، دکمه GPS را بزنید یا روی نقشه کلیک کنید
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`alert ${required ? 'alert-error' : 'alert-warning'}`}>
          <MapPin className="w-5 h-5" />
          <div className="text-sm">
            {required
              ? 'انتخاب موقعیت الزامی است. لطفاً موقعیت خود را مشخص کنید'
              : 'موقعیت دقیق خود را پین کنید تا تیم ارسال راحت‌تر شما را پیدا کند'}
          </div>
        </div>
      )}

      {error && (
        <div className={`alert ${selectedLat && selectedLng ? 'alert-warning' : 'alert-error'}`}>
          {selectedLat && selectedLng ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={gettingLocation || gettingIpLocation}
          className="btn btn-primary gap-2"
        >
          {gettingLocation ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              در حال دریافت...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              موقعیت GPS
            </>
          )}
        </button>

        <button
          type="button"
          onClick={getLocationFromIP}
          disabled={gettingLocation || gettingIpLocation}
          className="btn btn-soft gap-2"
        >
          {gettingIpLocation ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              در حال دریافت...
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              موقعیت تقریبی
            </>
          )}
        </button>

        <button
          type="button"
          onClick={openGoogleMapsForSelection}
          disabled={gettingLocation || gettingIpLocation}
          className="btn btn-ghost gap-2"
        >
          <MapPin className="w-4 h-4" />
          گوگل مپ
        </button>
      </div>
    </div>
  )
}
