'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface FreeDeliverySettings {
  enabled: boolean
  threshold: number
  badgeText: string
}

interface SiteSettings {
  shippingCost: number
  freeDelivery: FreeDeliverySettings
  loading: boolean
}

const defaultSettings: SiteSettings = {
  shippingCost: 50,
  freeDelivery: {
    enabled: true,
    threshold: 1000,
    badgeText: 'ارسال رایگان',
  },
  loading: true,
}

const SiteSettingsContext = createContext<SiteSettings>(defaultSettings)

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/globals/site-settings')
        if (res.ok) {
          const data = await res.json()
          setSettings({
            shippingCost: data.shippingCost ?? 50,
            freeDelivery: {
              enabled: data.freeDeliveryEnabled ?? true,
              threshold: data.freeDeliveryThreshold ?? 1000,
              badgeText: data.freeDeliveryBadgeText ?? 'ارسال رایگان',
            },
            loading: false,
          })
        } else {
          // Use defaults if fetch fails
          setSettings((prev) => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Failed to fetch site settings:', error)
        setSettings((prev) => ({ ...prev, loading: false }))
      }
    }

    fetchSettings()
  }, [])

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}

/**
 * Calculate shipping cost based on subtotal and site settings
 */
export function calculateShipping(
  subtotal: number,
  freeDelivery: FreeDeliverySettings,
  shippingCost: number = 50,
): { cost: number; isFree: boolean } {
  if (!freeDelivery.enabled) {
    // If free delivery is disabled, always charge shipping
    return { cost: shippingCost, isFree: false }
  }

  if (subtotal >= freeDelivery.threshold) {
    return { cost: 0, isFree: true }
  }

  // Charge shipping when below threshold
  return { cost: shippingCost, isFree: false }
}

/**
 * Get the remaining amount needed for free shipping
 */
export function getRemainingForFreeShipping(
  subtotal: number,
  freeDelivery: FreeDeliverySettings,
): number | null {
  if (!freeDelivery.enabled) return null
  if (subtotal >= freeDelivery.threshold) return null
  return freeDelivery.threshold - subtotal
}

export default SiteSettingsProvider
