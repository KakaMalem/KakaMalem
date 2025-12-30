'use client'

import { createContext, useState, useCallback, useEffect, use, useRef } from 'react'
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

  // Track pending operations to prevent race conditions
  const pendingOperations = useRef<Set<string>>(new Set())
  // Track debounce timers for quantity updates
  const updateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  // Track the latest quantity for each item (for debounced updates)
  const latestQuantities = useRef<Map<string, number>>(new Map())

  /**
   * Refresh cart from server
   */
  const refreshCart = useCallback(async () => {
    setLoading(true)
    setError(null)

    const response = await cartApi.fetchCart()

    if (response.success && response.data) {
      setCart(response.data)
      setError(null) // Clear any previous errors on successful fetch
    } else {
      setError(response.error || 'Failed to load cart')
      setCart({ items: [] })
    }

    setLoading(false)
  }, [])

  /**
   * Add item to cart (with optimistic update for better responsiveness)
   */
  const addItem = useCallback(
    async (productId: string, quantity: number = 1, variantId?: string) => {
      const operationKey = `add-${productId}-${variantId || 'no-variant'}`

      // Skip if same operation is already pending
      if (pendingOperations.current.has(operationKey)) {
        return
      }

      pendingOperations.current.add(operationKey)

      try {
        // Optimistic update: add/update item immediately
        setCart((prevCart) => {
          const existingIndex = prevCart.items.findIndex(
            (item) =>
              item.productId === productId &&
              (variantId ? item.variantId === variantId : !item.variantId),
          )

          if (existingIndex !== -1) {
            // Update existing item
            const newItems = [...prevCart.items]
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            }
            return { items: newItems }
          } else {
            // Add new item (will be populated with full data after API call)
            return {
              items: [
                ...prevCart.items,
                {
                  productId,
                  quantity,
                  variantId,
                  addedAt: new Date().toISOString(),
                },
              ],
            }
          }
        })

        // Make API call in background
        const response = await cartApi.addToCart(productId, quantity, variantId)

        if (response.success) {
          // Refresh to get full product data populated
          await refreshCart()
        } else {
          // On failure, refresh to revert optimistic update
          await refreshCart()
          throw new Error(response.error || 'Failed to add item')
        }
      } finally {
        pendingOperations.current.delete(operationKey)
      }
    },
    [refreshCart],
  )

  /**
   * Remove item from cart (with optimistic update and debouncing)
   */
  const removeItem = useCallback(
    async (productId: string, variantId?: string) => {
      const operationKey = `remove-${productId}-${variantId || 'no-variant'}`

      // Skip if this exact operation is already pending
      if (pendingOperations.current.has(operationKey)) {
        return
      }

      pendingOperations.current.add(operationKey)
      setError(null)

      try {
        // Optimistic update using functional setState to get latest state
        setCart((prevCart) => ({
          items: prevCart.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                (variantId ? item.variantId === variantId : !item.variantId)
              ),
          ),
        }))

        // Make API call in background
        const response = await cartApi.removeFromCart(productId, variantId)

        if (!response.success) {
          // On failure, just refresh from server to get accurate state
          await refreshCart()
          setError(response.error || 'Failed to remove item')
          throw new Error(response.error || 'Failed to remove item')
        }
      } finally {
        pendingOperations.current.delete(operationKey)
      }
    },
    [refreshCart],
  )

  /**
   * Update item quantity (with optimistic update and debouncing)
   */
  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      const operationKey = `update-${productId}-${variantId || 'no-variant'}`

      setError(null)

      // Update UI immediately (optimistic update)
      setCart((prevCart) => ({
        items: prevCart.items
          .map((item) => {
            if (
              item.productId === productId &&
              (variantId ? item.variantId === variantId : !item.variantId)
            ) {
              return quantity === 0 ? null : { ...item, quantity }
            }
            return item
          })
          .filter(Boolean) as typeof prevCart.items,
      }))

      // Store the latest quantity
      latestQuantities.current.set(operationKey, quantity)

      // Clear any existing timer for this item
      const existingTimer = updateTimers.current.get(operationKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Debounce the API call
      const timer = setTimeout(async () => {
        const latestQty = latestQuantities.current.get(operationKey) || quantity

        try {
          const response = await cartApi.updateCartItem(productId, latestQty, variantId)

          if (!response.success) {
            // On failure, refresh from server to get accurate state
            await refreshCart()
            setError(response.error || 'Failed to update quantity')
          }
        } catch (err) {
          console.error('Update quantity error:', err)
          await refreshCart()
        } finally {
          updateTimers.current.delete(operationKey)
          latestQuantities.current.delete(operationKey)
        }
      }, 300) // 300ms debounce

      updateTimers.current.set(operationKey, timer)
    },
    [refreshCart],
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
