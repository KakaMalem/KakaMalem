import type { CartResponse } from './types'

/**
 * Cart API client functions
 * These are server-side safe and can be used in both client and server components
 */

const API_BASE = '/api'

/**
 * Fetch current cart
 */
export async function fetchCart(): Promise<CartResponse> {
  try {
    const response = await fetch(`${API_BASE}/cart`, {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching cart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch cart',
    }
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  variantId?: string,
): Promise<CartResponse> {
  try {
    const response = await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId, quantity, variantId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('Error adding to cart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to cart',
    }
  }
}

/**
 * Update item quantity
 */
export async function updateCartItem(
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<CartResponse> {
  try {
    const response = await fetch(`${API_BASE}/cart/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId, quantity, variantId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('Error updating cart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update cart',
    }
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(productId: string, variantId?: string): Promise<CartResponse> {
  try {
    const response = await fetch(`${API_BASE}/cart/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId, variantId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('Error removing from cart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item',
    }
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<CartResponse> {
  try {
    const response = await fetch(`${API_BASE}/cart/clear`, {
      method: 'POST',
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('Error clearing cart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cart',
    }
  }
}

/**
 * Merge guest cart with user cart after login
 */
export async function mergeCart(): Promise<CartResponse> {
  try {
    const response = await fetch(`${API_BASE}/cart/merge`, {
      method: 'POST',
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return data
  } catch (error) {
    console.error('Error merging cart:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to merge cart',
    }
  }
}
