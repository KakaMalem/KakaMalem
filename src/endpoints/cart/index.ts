/**
 * Cart Endpoints
 *
 * Production-grade cart management system with:
 * - Guest cart support via HTTP-only cookies
 * - Cart merging on login
 * - Stock validation and inventory checking
 * - Comprehensive error handling
 * - Rate limiting ready (implement via middleware)
 */

export { addToCart } from './addToCart'
export { getCart } from './getCart'
export { updateCart } from './updateCart'
export { removeFromCart } from './removeFromCart'
export { clearCart } from './clearCart'
export { mergeCart } from './mergeCart'
export type { CartItem, CartData } from './types'
