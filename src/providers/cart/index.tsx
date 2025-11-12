'use client'

import { createContext, useState, useCallback, useEffect, use } from 'react'
import * as cartApi from './cartApi'
import type { CartData, CartContextType } from './types'

const initialContext: CartContextType = {
  cart: { items: [] },
  loading: false,
  error: null,
  addItem: async () => {},
  removeItem: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
  mergeCart: async () => {},
}

const CartContext = createContext(initialContext)

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartData>({ items: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Refresh cart from server
   */
  const refreshCart = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await cartApi.fetchCart()

    if (response.success && response.data) {
      setCart(response.data)
    } else {
      setError(response.error || 'Failed to load cart')
      setCart({ items: [] })
    }

    setLoading(false)
  }, [])

  /**
   * Add item to cart
   */
  const addItem = useCallback(
    async (productId: string, quantity: number = 1, variantId?: string) => {
      setError(null)

      const response = await cartApi.addToCart(productId, quantity, variantId)

      if (response.success) {
        await refreshCart()
      } else {
        setError(response.error || 'Failed to add item')
        throw new Error(response.error || 'Failed to add item')
      }
    },
    [refreshCart],
  )

  /**
   * Remove item from cart (with optimistic update)
   */
  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      setError(null)

      // Optimistic update: remove item immediately
      const previousCart = { ...cart }
      const optimisticItems = cart.items.filter(
        (item) =>
          !(
            item.productId === productId &&
            (variantId ? item.variantId === variantId : !item.variantId)
          ),
      )
      setCart({ items: optimisticItems })

      // Make API call in background
      const response = await cartApi.removeFromCart(productId, variantId)

      if (!response.success) {
        // Revert optimistic update on failure
        setCart(previousCart)
        setError(response.error || 'Failed to remove item')
        throw new Error(response.error || 'Failed to remove item')
      }
    },
    [cart],
  )

  /**
   * Update item quantity (with optimistic update)
   */
  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      setError(null)

      // Optimistic update: update quantity immediately
      const previousCart = { ...cart }
      const optimisticItems = cart.items
        .map((item) => {
          if (
            item.productId === productId &&
            (variantId ? item.variantId === variantId : !item.variantId)
          ) {
            return quantity === 0 ? null : { ...item, quantity }
          }
          return item
        })
        .filter(Boolean) as typeof cart.items

      setCart({ items: optimisticItems })

      // Make API call in background
      const response = await cartApi.updateCartItem(productId, quantity, variantId)

      if (!response.success) {
        // Revert optimistic update on failure
        setCart(previousCart)
        setError(response.error || 'Failed to update quantity')
        throw new Error(response.error || 'Failed to update quantity')
      }
    },
    [cart],
  )

  /**
   * Clear cart (with optimistic update)
   */
  const clearCart = useCallback(async () => {
    setError(null)

    // Optimistic update: clear immediately
    const previousCart = { ...cart }
    setCart({ items: [] })

    // Make API call in background
    const response = await cartApi.clearCart()

    if (response.success) {
      // Already cleared, refresh to ensure sync
      await refreshCart()
    } else {
      // Revert optimistic update on failure
      setCart(previousCart)
      setError(response.error || 'Failed to clear cart')
      throw new Error(response.error || 'Failed to clear cart')
    }
  }, [cart, refreshCart])

  /**
   * Merge guest cart with user cart (call after login)
   */
  const mergeCart = useCallback(async () => {
    setError(null)

    const response = await cartApi.mergeCart()

    if (response.success) {
      await refreshCart()

      if (response.warnings && response.warnings.length > 0) {
        console.warn('Cart merge warnings:', response.warnings)
      }
    } else {
      setError(response.error || 'Failed to merge cart')
      throw new Error(response.error || 'Failed to merge cart')
    }
  }, [refreshCart])

  /**
   * Load cart on mount
   */
  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  /**
   * Listen for cart update events
   */
  useEffect(() => {
    const handleCartUpdate = () => {
      refreshCart()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    return () => window.removeEventListener('cartUpdated', handleCartUpdate)
  }, [refreshCart])

  return (
    <CartContext
      value={{
        cart,
        loading,
        error,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
        mergeCart,
      }}
    >
      {children}
    </CartContext>
  )
}

export const useCart = (): CartContextType => use(CartContext)
