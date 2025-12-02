import type { CartData, CartItem } from './types'

/**
 * Calculate total item count in cart
 */
export function getCartItemCount(cart: CartData): number {
  return cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

/**
 * Calculate cart subtotal
 * Converts all prices to AFN (base currency) for accurate totals
 * Exchange rate: 1 USD = 66 AFN
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (!item.product) return sum
    const price = item.product.salePrice || item.product.price || 0
    const currency = item.product.currency || 'AFN'

    // Convert USD to AFN (1 USD = 66 AFN)
    const priceInAFN = currency === 'USD' ? price * 66 : price

    return sum + priceInAFN * item.quantity
  }, 0)
}

/**
 * Calculate cart totals with shipping
 * Supports both AFN and USD with proper currency conversion
 */
export function calculateCartTotals(items: CartItem[], currency: 'USD' | 'AFN' = 'AFN') {
  const subtotal = calculateSubtotal(items)

  // Free shipping thresholds: 1000 AFN or 15 USD
  const freeShippingThreshold = currency === 'AFN' ? 1000 : 15
  const shippingCost = currency === 'AFN' ? 10 : 0.15

  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost
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

  if (item.product._status && item.product._status !== 'published') {
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
 * Format currency with custom symbols
 * AFN: ؋ (Afghan Afghani symbol)
 * USD: $ (Dollar sign)
 */
export function formatCurrency(amount: number, currency: string = 'AFN'): string {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  if (currency === 'AFN') {
    return `؋${formattedAmount}`
  } else if (currency === 'USD') {
    return `$${formattedAmount}`
  }

  // Fallback to default
  return `${currency} ${formattedAmount}`
}
