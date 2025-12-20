'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ShippingMode = 'always_free' | 'free_above_threshold' | 'always_charged'

export interface ShippingSettings {
  mode: ShippingMode
  cost: number
  freeThreshold: number
}

export const FREE_DELIVERY_BADGE_TEXT = 'ارسال رایگان'

interface SiteSettings {
  shipping: ShippingSettings
  loading: boolean
}

const defaultSettings: SiteSettings = {
  shipping: {
    mode: 'free_above_threshold',
    cost: 50,
    freeThreshold: 1000,
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
            shipping: {
              mode: data.shippingMode ?? 'free_above_threshold',
              cost: data.shippingCost ?? 50,
              freeThreshold: data.freeDeliveryThreshold ?? 1000,
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
 * Calculate shipping cost based on subtotal and shipping settings
 */
export function calculateShipping(
  subtotal: number,
  shipping: ShippingSettings,
): { cost: number; isFree: boolean } {
  switch (shipping.mode) {
    case 'always_free':
      return { cost: 0, isFree: true }
    case 'always_charged':
      return { cost: shipping.cost, isFree: false }
    case 'free_above_threshold':
    default:
      if (subtotal >= shipping.freeThreshold) {
        return { cost: 0, isFree: true }
      }
      return { cost: shipping.cost, isFree: false }
  }
}

/**
 * Get the remaining amount needed for free shipping
 * Returns null if shipping is already free or no threshold applies
 */
export function getRemainingForFreeShipping(
  subtotal: number,
  shipping: ShippingSettings,
): number | null {
  // Only show remaining for threshold mode
  if (shipping.mode !== 'free_above_threshold') return null
  // If already qualified for free delivery
  if (subtotal >= shipping.freeThreshold) return null
  return shipping.freeThreshold - subtotal
}

export default SiteSettingsProvider
