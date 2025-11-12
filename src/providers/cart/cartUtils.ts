import type { CartData, CartItem } from './types'

/**
 * Calculate total item count in cart
 */
export function getCartItemCount(cart: CartData): number {
  return cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

/**
 * Calculate cart subtotal
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.product) return sum
    const price = item.product.salePrice || item.product.price || 0
    return sum + price * item.quantity
  }, 0)
}

/**
 * Calculate cart totals with shipping
 */
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = calculateSubtotal(items)
  const shipping = subtotal >= 1000 ? 0 : 10 // Free shipping for orders 1000 AFN or more
  const total = subtotal + shipping

  return {
    subtotal,
    shipping,
    total,
  }
}

/**
 * Check if cart is empty
 */
export function isCartEmpty(cart: CartData): boolean {
  return !cart.items || cart.items.length === 0
}

/**
 * Find item in cart
 */
export function findCartItem(
  cart: CartData,
  productId: string,
  variantId?: string,
): CartItem | undefined {
  return cart.items?.find(
    (item) =>
      item.productId === productId && (variantId ? item.variantId === variantId : !item.variantId),
  )
}

/**
 * Check if product is in cart
 */
export function isInCart(cart: CartData, productId: string, variantId?: string): boolean {
  return !!findCartItem(cart, productId, variantId)
}

/**
 * Get quantity for a specific product in cart
 */
export function getCartItemQuantity(cart: CartData, productId: string, variantId?: string): number {
  const item = findCartItem(cart, productId, variantId)
  return item?.quantity || 0
}

/**
 * Validate cart item stock
 */
export function validateCartItemStock(item: CartItem): {
  isValid: boolean
  message?: string
} {
  if (!item.product) {
    return { isValid: false, message: 'Product not found' }
  }

  if (item.product.status !== 'published') {
    return { isValid: false, message: 'Product is no longer available' }
  }

  if (item.product.trackQuantity) {
    if (item.quantity > item.product.quantity) {
      return {
        isValid: false,
        message: `Only ${item.product.quantity} available in stock`,
      }
    }
  }

  return { isValid: true }
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
