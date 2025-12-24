/**
 * Utility functions for UI components automatically added by ShadCN and used in a few of our frontend components and blocks.
 *
 * Other functions may be exported from here in the future or by installing other shadcn components.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Media, Product, ProductVariant, User } from '@/payload-types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Placeholder image for products without images
 */
export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

/**
 * Extract URL from a Media object or string
 * Handles various formats: string ID, Media object, or object with url property
 */
export function extractMediaUrl(mediaItem: unknown): string | null {
  if (typeof mediaItem === 'string') return mediaItem

  if (typeof mediaItem === 'object' && mediaItem !== null) {
    const media = mediaItem as Media | { url?: string | null }

    if ('url' in media && typeof media.url === 'string' && media.url) {
      return media.url
    }

    const possibleUrl = (media as { url?: string | null }).url
    if (typeof possibleUrl === 'string' && possibleUrl) {
      return possibleUrl
    }
  }

  return null
}

/**
 * Get product image URL with proper prioritization:
 * 1. Variant images (if variant provided)
 * 2. Product main images
 * 3. Placeholder
 */
export function getProductImageUrl(
  product: Product | null,
  variant?: ProductVariant | null,
): string {
  // Priority 1: Variant images
  if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
    const url = extractMediaUrl(variant.images[0])
    if (url) return url
  }

  // Priority 2: Product main images
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const url = extractMediaUrl(product.images[0])
    if (url) return url
  }

  // Priority 3: Placeholder
  return PLACEHOLDER_IMAGE
}

/**
 * Format variant options for display
 * Returns formatted string like "Size: Large, Color: Red"
 */
export function formatVariantOptions(variant?: ProductVariant | null): string | null {
  if (!variant?.options || variant.options.length === 0) return null

  return variant.options.map((opt) => `${opt.name}: ${opt.value}`).join(', ')
}

/**
 * Stock Status Types
 */
export type StockStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'low_stock'
  | 'on_backorder'
  | 'discontinued'

/**
 * Get Persian label for stock status
 */
export function getStockStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    in_stock: 'موجود',
    out_of_stock: 'ناموجود',
    low_stock: 'محدود',
    on_backorder: 'پیش‌سفارش',
    discontinued: 'توقف تولید',
  }

  return labels[status] || 'نامشخص'
}

/**
 * Get DaisyUI badge class for stock status
 * Returns appropriate badge styling based on status
 */
export function getStockStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    in_stock: 'badge-success',
    out_of_stock: 'badge-error',
    low_stock: 'badge-warning',
    on_backorder: 'badge-info',
    discontinued: 'badge-neutral',
  }

  return classes[status] || 'badge-ghost'
}

/**
 * Get text color class for stock status
 */
export function getStockStatusTextClass(status: string): string {
  const classes: Record<string, string> = {
    in_stock: 'text-success',
    out_of_stock: 'text-error',
    low_stock: 'text-warning',
    on_backorder: 'text-info',
    discontinued: 'text-neutral',
  }

  return classes[status] || 'text-base-content'
}

/**
 * Check if product/variant is available for purchase
 */
export function isProductAvailable(
  product: Product | ProductVariant,
  quantity = 1,
): { available: boolean; reason?: string } {
  const stockStatus = product.stockStatus || 'in_stock'

  // Discontinued products are never available
  if (stockStatus === 'discontinued') {
    return { available: false, reason: 'این محصول دیگر تولید نمی‌شود' }
  }

  // If not tracking quantity, check stock status only
  if (!product.trackQuantity) {
    if (stockStatus === 'out_of_stock') {
      return { available: false, reason: 'محصول ناموجود است' }
    }
    return { available: true }
  }

  // Check actual quantity
  const availableQty = product.quantity || 0

  if (availableQty === 0) {
    if (product.allowBackorders) {
      return { available: true }
    }
    return { available: false, reason: 'محصول ناموجود است' }
  }

  if (availableQty < quantity) {
    return { available: false, reason: `تنها ${availableQty} عدد در گدام موجود است` }
  }

  return { available: true }
}

/**
 * Get user profile picture URL with proper prioritization:
 * 1. User-uploaded profile picture (profilePicture field from media collection)
 * 2. OAuth profile picture (picture field from Google)
 * 3. null (fallback to initials)
 */
export function getUserProfilePictureUrl(user: User | null): string | null {
  if (!user) return null

  // Priority 1: User-uploaded profile picture
  if (user.profilePicture) {
    const pic = user.profilePicture
    if (typeof pic === 'object' && pic !== null && 'url' in pic) {
      return (pic as Media).url || null
    }
  }

  // Priority 2: OAuth profile picture (from Google)
  if (user.picture) {
    return user.picture
  }

  return null
}

/**
 * Get user initials for fallback avatar
 */
export function getUserInitials(user: User | null): string {
  if (!user) return '?'
  const firstInitial = user.firstName?.[0] || ''
  const lastInitial = user.lastName?.[0] || ''
  return (firstInitial + lastInitial).toUpperCase() || '?'
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) return 'کاربر'
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name || 'کاربر'
}
