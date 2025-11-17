'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Product } from '@/payload-types'

interface WishlistContextType {
  wishlist: string[]
  isInWishlist: (productId: string) => boolean
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  toggleWishlist: (productId: string) => Promise<void>
  loadingItems: Set<string>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch wishlist on mount
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user?.wishlist) {
            // Extract IDs from wishlist (could be populated objects or just IDs)
            const wishlistIds = data.user.wishlist.map((item: string | Product) =>
              typeof item === 'string' ? item : item.id,
            )
            setWishlist(wishlistIds)
          }
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    fetchWishlist()
  }, [])

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.includes(productId)
    },
    [wishlist],
  )

  const addToWishlist = useCallback(async (productId: string) => {
    setLoadingItems((prev) => new Set(prev).add(productId))
    try {
      const response = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add to wishlist')
      }

      const data = await response.json()
      const wishlistIds = data.wishlist.map((item: string | Product) =>
        typeof item === 'string' ? item : item.id,
      )
      setWishlist(wishlistIds)
    } catch (error: any) {
      console.error('Error adding to wishlist:', error)
      throw error
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }, [])

  const removeFromWishlist = useCallback(async (productId: string) => {
    setLoadingItems((prev) => new Set(prev).add(productId))
    try {
      const response = await fetch('/api/wishlist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove from wishlist')
      }

      const data = await response.json()
      const wishlistIds = data.wishlist.map((item: string | Product) =>
        typeof item === 'string' ? item : item.id,
      )
      setWishlist(wishlistIds)
    } catch (error: any) {
      console.error('Error removing from wishlist:', error)
      throw error
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }, [])

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId)
      } else {
        await addToWishlist(productId)
      }
    },
    [isInWishlist, addToWishlist, removeFromWishlist],
  )

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        loadingItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
