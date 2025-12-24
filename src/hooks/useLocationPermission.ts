'use client'

import { useState, useEffect, useCallback } from 'react'

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt'

interface UseLocationPermissionReturn {
  /** Whether to show a location permission prompt to the user */
  shouldShowLocationPrompt: boolean
  /** Whether we're still checking the permission status */
  isCheckingPermission: boolean
  /** Current permission state */
  permissionState: PermissionState
  /** Request location permission and get coordinates */
  requestLocation: () => Promise<GeolocationPosition | null>
  /** Update location on server after getting permission */
  updateServerLocation: (position: GeolocationPosition) => Promise<boolean>
  /** Dismiss the location prompt */
  dismissPrompt: () => void
}

const DISMISSED_KEY = 'location_prompt_dismissed'
const DISMISSED_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Hook to manage browser geolocation permission
 * Shows a prompt only when permission is in 'prompt' state (never asked before)
 * and user hasn't dismissed it recently
 */
export function useLocationPermission(): UseLocationPermissionReturn {
  const [shouldShowLocationPrompt, setShouldShowLocationPrompt] = useState(false)
  const [isCheckingPermission, setIsCheckingPermission] = useState(true)
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown')

  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          setPermissionState('denied')
          setShouldShowLocationPrompt(false)
          setIsCheckingPermission(false)
          return
        }

        // Check secure context (but allow localhost in development)
        const isLocalhost =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        if (!window.isSecureContext && !isLocalhost) {
          setPermissionState('denied')
          setShouldShowLocationPrompt(false)
          setIsCheckingPermission(false)
          return
        }

        // Check if user previously dismissed the prompt
        const dismissedData = localStorage.getItem(DISMISSED_KEY)
        if (dismissedData) {
          try {
            const { timestamp } = JSON.parse(dismissedData)
            if (Date.now() - timestamp < DISMISSED_EXPIRY) {
              // User dismissed recently, don't show prompt
              setPermissionState('prompt')
              setShouldShowLocationPrompt(false)
              setIsCheckingPermission(false)
              return
            } else {
              // Dismissal expired, remove it
              localStorage.removeItem(DISMISSED_KEY)
            }
          } catch {
            localStorage.removeItem(DISMISSED_KEY)
          }
        }

        // Check current permission state using Permissions API
        if ('permissions' in navigator) {
          try {
            const permission = await navigator.permissions.query({ name: 'geolocation' })
            setPermissionState(permission.state as PermissionState)

            // Only show prompt if permission is in 'prompt' state (never asked before)
            if (permission.state === 'prompt') {
              setShouldShowLocationPrompt(true)
            } else {
              setShouldShowLocationPrompt(false)
            }

            // Listen for permission changes
            const handleChange = () => {
              setPermissionState(permission.state as PermissionState)
              if (permission.state !== 'prompt') {
                setShouldShowLocationPrompt(false)
              }
            }
            permission.addEventListener('change', handleChange)

            // Cleanup listener on unmount
            return () => permission.removeEventListener('change', handleChange)
          } catch {
            // Permissions API might not support geolocation query in some browsers
            // Fallback: Try to detect if permission was previously denied
            navigator.geolocation.getCurrentPosition(
              () => {
                // Permission granted
                setPermissionState('granted')
                setShouldShowLocationPrompt(false)
              },
              (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                  setPermissionState('denied')
                  setShouldShowLocationPrompt(false)
                } else {
                  // Likely in prompt state or other error
                  setPermissionState('prompt')
                  setShouldShowLocationPrompt(true)
                }
              },
              { timeout: 1000, maximumAge: Infinity },
            )
          }
        } else {
          // Very old browser - assume we should ask
          setPermissionState('prompt')
          setShouldShowLocationPrompt(true)
        }
      } catch (error) {
        console.error('Error checking location permission:', error)
        setPermissionState('unknown')
        setShouldShowLocationPrompt(false)
      } finally {
        setIsCheckingPermission(false)
      }
    }

    checkLocationPermission()
  }, [])

  /**
   * Request location permission and get current position
   */
  const requestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissionState('granted')
          setShouldShowLocationPrompt(false)
          resolve(position)
        },
        (error) => {
          console.error('Geolocation error:', error)
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionState('denied')
          }
          setShouldShowLocationPrompt(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // Accept cached position up to 1 minute old
        },
      )
    })
  }, [])

  /**
   * Send location to server after user grants permission
   */
  const updateServerLocation = useCallback(
    async (position: GeolocationPosition): Promise<boolean> => {
      try {
        const response = await fetch('/api/update-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update location: ${response.status}`)
        }

        return true
      } catch (error) {
        console.error('Failed to update server location:', error)
        return false
      }
    },
    [],
  )

  /**
   * Dismiss the location prompt for 7 days
   */
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify({ timestamp: Date.now() }))
    setShouldShowLocationPrompt(false)
  }, [])

  return {
    shouldShowLocationPrompt,
    isCheckingPermission,
    permissionState,
    requestLocation,
    updateServerLocation,
    dismissPrompt,
  }
}
