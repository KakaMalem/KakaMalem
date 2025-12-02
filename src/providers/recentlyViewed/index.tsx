'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Media } from '@/payload-types'

const STORAGE_KEY = 'guest_recently_viewed'
const MAX_GUEST_ITEMS = 20

interface RecentlyViewedProduct {
  product: {
    id: string
    name: string
    slug: string
    price: number
    salePrice?: number
    currency: string
    images?: (string | Media)[]
    averageRating?: number
    reviewCount?: number
    stockStatus?: string
  }
  viewedAt: string
}

interface GuestViewedItem {
  productId: string
  viewedAt: string
}

interface RecentlyViewedContextType {
  recentlyViewed: RecentlyViewedProduct[]
  guestItems: GuestViewedItem[]
  trackView: (productId: string) => Promise<void>
  refreshRecentlyViewed: () => Promise<void>
  mergeGuestData: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean | null
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined)

export const RecentlyViewedProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [guestItems, setGuestItems] = useState<GuestViewedItem[]>([])

  // Load guest data from localStorage
  const loadGuestData = useCallback((): GuestViewedItem[] => {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Error loading guest recently viewed:', error)
      return []
    }
  }, [])

  // Save guest data to localStorage
  const saveGuestData = useCallback((items: GuestViewedItem[]) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving guest recently viewed:', error)
    }
  }, [])

  // Clear guest data from localStorage
  const clearGuestData = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(STORAGE_KEY)
      setGuestItems([])
    } catch (error) {
      console.error('Error clearing guest recently viewed:', error)
    }
  }, [])

  // Fetch recently viewed products from server
  const refreshRecentlyViewed = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/recently-viewed?limit=10', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          if (data.isGuest) {
            // Guest user - use localStorage
            setIsAuthenticated(false)
            const localItems = loadGuestData()
            setGuestItems(localItems)
            setRecentlyViewed([])
          } else {
            // Authenticated user - use server data
            setRecentlyViewed(data.data)
            setGuestItems([])
            setIsAuthenticated(true)
          }
        }
      } else {
        // Unexpected error, fallback to guest mode
        setIsAuthenticated(false)
        const localItems = loadGuestData()
        setGuestItems(localItems)
        setRecentlyViewed([])
      }
    } catch (_error) {
      // On error, assume guest and load from localStorage
      setIsAuthenticated(false)
      const localItems = loadGuestData()
      setGuestItems(localItems)
      setRecentlyViewed([])
    } finally {
      setIsLoading(false)
    }
  }, [loadGuestData])

  // Track a product view
  const trackView = useCallback(
    async (productId: string) => {
      // If we don't know auth status yet, wait for it
      if (isAuthenticated === null) {
        await refreshRecentlyViewed()
      }

      // If authenticated, track via API
      if (isAuthenticated) {
        try {
          const response = await fetch('/api/track-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ productId }),
          })

          if (response.ok) {
            // Success - refresh from server
            await refreshRecentlyViewed()
          } else if (response.status === 401) {
            // Session expired, switch to guest mode
            setIsAuthenticated(false)
            const items = loadGuestData()
            const filteredItems = items.filter((item) => item.productId !== productId)
            const updatedItems = [
              { productId, viewedAt: new Date().toISOString() },
              ...filteredItems,
            ].slice(0, MAX_GUEST_ITEMS)
            saveGuestData(updatedItems)
            setGuestItems(updatedItems)
          }
        } catch (error) {
          console.error('Error tracking view:', error)
        }
      } else {
        // Guest user - save to localStorage
        const items = loadGuestData()
        const filteredItems = items.filter((item) => item.productId !== productId)
        const updatedItems = [
          { productId, viewedAt: new Date().toISOString() },
          ...filteredItems,
        ].slice(0, MAX_GUEST_ITEMS)
        saveGuestData(updatedItems)
        setGuestItems(updatedItems)
      }
    },
    [isAuthenticated, refreshRecentlyViewed, loadGuestData, saveGuestData],
  )

  // Merge guest data with user account after login
  const mergeGuestData = useCallback(async () => {
    const guestItems = loadGuestData()

    if (guestItems.length === 0) {
      // No guest data to merge, just refresh
      await refreshRecentlyViewed()
      return
    }

    try {
      const response = await fetch('/api/merge-recently-viewed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ guestItems }),
      })

      if (response.ok) {
        // Clear guest data after successful merge
        clearGuestData()
        await refreshRecentlyViewed()
      }
    } catch (error) {
      console.error('Error merging recently viewed:', error)
      // Still try to refresh
      await refreshRecentlyViewed()
    }
  }, [loadGuestData, clearGuestData, refreshRecentlyViewed])

  // Load recently viewed on mount
  useEffect(() => {
    refreshRecentlyViewed()
  }, [refreshRecentlyViewed])

  return (
    <RecentlyViewedContext.Provider
      value={{
        recentlyViewed,
        guestItems,
        trackView,
        refreshRecentlyViewed,
        mergeGuestData,
        isLoading,
        isAuthenticated,
      }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext)
  if (!context) {
    throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider')
  }
  return context
}
