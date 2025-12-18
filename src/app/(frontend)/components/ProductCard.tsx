'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Check, AlertTriangle, Clock, PackageX } from 'lucide-react'
import { Product, Media } from '@/payload-types'
import { useCart } from '@/providers'
import { StarRating } from './StarRating'
import { formatPrice } from '@/utilities/currency'
import { getStockStatusLabel, getStockStatusTextClass } from '@/utilities/ui'

interface ProductCardProps {
  product: Product
}

/**
 * EnrichedProduct: Product shape extended with fields that the search API
 * may inject at runtime (so we can avoid `any` and be explicit).
 *
 * The search API selects the "best" variant to display based on priority
 * (blending availability with business logic):
 *
 * 1. Default variant (if AVAILABLE - in_stock, low_stock, on_backorder)
 * 2. Best-selling AVAILABLE variant (if default unavailable/not set)
 * 3. Default variant (even if unavailable - respects admin choice)
 * 4. Best-selling variant (even if unavailable - shows popularity)
 * 5. First AVAILABLE variant (new products with no sales)
 * 6. First variant (fallback when all are unavailable)
 * 7. Product data itself (if no variants exist)
 *
 * This ensures users see available products first while respecting admin
 * preferences and falling back gracefully when stock is depleted.
 */
type DefaultVariantImage = string | { url?: string | null } | Media

type EnrichedProduct = Product & {
  defaultVariantId?: string
  defaultVariantSku?: string
  defaultVariantStockStatus?: string
  defaultVariantTotalSold?: number
  defaultVariantQuantity?: number
  defaultVariantImages?: DefaultVariantImage[]
  defaultVariantPrice?: number
  defaultVariantCompareAtPrice?: number
}

/**
 * UTILITY: Robust Media Resolver
 * Priority:
 * 1. API-injected Default Variant Image (if search API enriches it)
 * 2. Product Main Images (The 'images' field on Products collection)
 * 3. Fallback Placeholder
 */
const getProductMedia = (product: Product): string => {
  const placeholder =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

  const p = product as EnrichedProduct
  if (
    p.defaultVariantImages &&
    Array.isArray(p.defaultVariantImages) &&
    p.defaultVariantImages.length > 0
  ) {
    const varImg = p.defaultVariantImages[0]

    if (typeof varImg === 'string') return varImg

    // Check if it's a Media object with a valid URL
    if ((varImg as Media)?.url && typeof (varImg as Media).url === 'string') {
      return (varImg as Media).url as string
    }

    // Check if it's a generic object with a url string
    if (typeof varImg === 'object' && varImg !== null) {
      const possibleUrl = (varImg as { url?: string | null }).url
      if (typeof possibleUrl === 'string') return possibleUrl
    }
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const mainImg = product.images[0]

    if (typeof mainImg === 'string') return mainImg

    if (typeof mainImg === 'object' && mainImg !== null) {
      const mediaItem = mainImg as Media | { image?: { url?: string } }

      const directUrl = (mediaItem as Media).url
      if (typeof directUrl === 'string') return directUrl

      const nestedUrl = (mediaItem as { image?: { url?: string } }).image?.url
      if (typeof nestedUrl === 'string') return nestedUrl

      return placeholder
    }
  }

  const enriched = product as EnrichedProduct
  if (enriched.hasVariants && enriched.variantOptions) {
    for (const option of enriched.variantOptions) {
      for (const val of option.values || []) {
        if (val?.image) {
          const optImg = val.image as Media | string
          if (typeof optImg === 'string') return optImg

          // Fix for stricter type checking on Media URL
          const mediaUrl = (optImg as Media).url
          if (typeof mediaUrl === 'string') return mediaUrl
        }
      }
    }
  }

  return placeholder
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, cart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  // -- SAFELY NORMALIZE STRINGS TO AVOID TS ERRORS --
  const safeName: string = product.name ?? ''
  const currency: string = product.currency ?? 'AFN'
  const safeAverageRating: number =
    typeof product.averageRating === 'number' ? product.averageRating : 0
  const safeReviewCount: number = typeof product.reviewCount === 'number' ? product.reviewCount : 0

  const enriched = product as EnrichedProduct

  // -- PRICE LOGIC --
  const rawPrice =
    enriched.hasVariants && typeof enriched.defaultVariantPrice === 'number'
      ? enriched.defaultVariantPrice
      : (product.price ?? 0)

  const comparePrice =
    enriched.hasVariants && typeof enriched.defaultVariantCompareAtPrice === 'number'
      ? enriched.defaultVariantCompareAtPrice
      : product.salePrice

  const hasDiscount =
    typeof comparePrice === 'number' && comparePrice > rawPrice
      ? true
      : typeof product.salePrice === 'number' && product.salePrice < (product.price ?? 0)

  const displayPrice = rawPrice
  const oldPrice = hasDiscount ? (comparePrice ?? product.price) : null

  // -- STOCK LOGIC --
  // PRIORITY: Use variant stock status if available (for products with variants)
  // Otherwise use product stock status (for products without variants)
  const stockStatus: string =
    product.hasVariants && enriched.defaultVariantStockStatus
      ? enriched.defaultVariantStockStatus
      : (product.stockStatus ?? 'in_stock')
  const isOutOfStock = stockStatus === 'out_of_stock' || stockStatus === 'discontinued'
  const isLowStock = stockStatus === 'low_stock'
  const isBackorder = stockStatus === 'on_backorder'

  // Check quantity in cart (for products without variants or with default variant)
  const getQuantityInCart = () => {
    if (!cart?.items) return 0

    // For products with variants, check default variant in cart
    if (product.hasVariants && enriched.defaultVariantId) {
      const variantCartItem = cart.items.find(
        (item) => item.productId === product.id && item.variantId === enriched.defaultVariantId,
      )
      return variantCartItem?.quantity || 0
    }

    // For products without variants
    const productCartItem = cart.items.find((item) => item.productId === product.id)
    return productCartItem?.quantity || 0
  }

  const quantityInCart = getQuantityInCart()

  // Calculate max quantity based on stock
  // PRIORITY: Use variant quantity if available, otherwise use product quantity
  const availableQuantity =
    product.hasVariants && enriched.defaultVariantQuantity !== undefined
      ? enriched.defaultVariantQuantity
      : product.quantity

  const trackQuantity = product.trackQuantity // Variants inherit this from product
  const allowBackorders = product.allowBackorders // Variants inherit this from product

  const maxQuantity =
    trackQuantity && availableQuantity && !allowBackorders ? Math.min(99, availableQuantity) : 99

  // Check if at max quantity
  const isAtMaxQuantity = quantityInCart >= maxQuantity

  // -- MEDIA & IDENTITY --
  const imageUrl = getProductMedia(product)

  // Ensure slug is a string (never undefined/null)
  const slug: string =
    product.slug ?? (product.id !== undefined && product.id !== null ? String(product.id) : '')

  // Ensure alt text is string
  const imageAlt: string = safeName || 'Product image'

  // Build product URL with variant parameter if available
  const productUrl = enriched.defaultVariantId
    ? `/product/${encodeURIComponent(slug)}?variant=${enriched.defaultVariantId}`
    : `/product/${encodeURIComponent(slug)}`

  // Play success sound - a pleasant two-tone beep
  const playSuccessSound = () => {
    try {
      // Type for older browsers with webkitAudioContext
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextConstructor()

      // First tone (higher pitch)
      const oscillator1 = audioContext.createOscillator()
      const gainNode1 = audioContext.createGain()

      oscillator1.connect(gainNode1)
      gainNode1.connect(audioContext.destination)

      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      gainNode1.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

      oscillator1.start(audioContext.currentTime)
      oscillator1.stop(audioContext.currentTime + 0.15)

      // Second tone (even higher pitch) - delayed slightly
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()

      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)

      oscillator2.type = 'sine'
      oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
      gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)

      oscillator2.start(audioContext.currentTime + 0.1)
      oscillator2.stop(audioContext.currentTime + 0.25)
    } catch (error) {
      // Silently fail if audio doesn't work
      console.debug('Audio playback not available:', error)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isAdding || isOutOfStock || isAtMaxQuantity) return

    setIsAdding(true)
    try {
      await addItem(product.id, 1, enriched.defaultVariantId)
      playSuccessSound()
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Link href={productUrl} className="group block h-full">
      <article className="card card-compact bg-base-100 border border-base-200 h-full hover:border-base-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
        {/* IMAGE AREA */}
        <figure className="relative aspect-[4/5] bg-base-200 overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
          />

          {/* BADGES */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
            {hasDiscount && !isOutOfStock && (
              <span className="badge badge-error text-white font-bold border-none shadow-sm text-xs">
                تخفیف
              </span>
            )}
          </div>
        </figure>

        {/* CONTENT AREA */}
        <div className="card-body gap-1.5 p-4">
          {/* Title */}
          <h3 className="font-semibold text-sm md:text-base leading-snug text-base-content group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5em]">
            {safeName}
          </h3>

          {/* Rating */}
          {safeAverageRating > 0 && (
            <div className="flex items-center gap-1.5 opacity-60">
              <StarRating rating={safeAverageRating} size="sm" />
              <span className="text-[10px] font-bold tracking-tight">({safeReviewCount})</span>
            </div>
          )}

          {/* Footer: Price & Action */}
          <div className="mt-auto pt-3 flex items-end justify-between border-t border-base-100 group-hover:border-base-200 transition-colors">
            <div className="flex flex-col">
              {/* Prices */}
              <div className="flex flex-col leading-none">
                {oldPrice && (
                  <span className="text-xs line-through opacity-40 mb-1">
                    {formatPrice(oldPrice, currency)}
                  </span>
                )}
                <span
                  className={`font-bold text-lg tracking-tight ${hasDiscount ? 'text-error' : 'text-base-content'}`}
                >
                  {formatPrice(displayPrice, currency)}
                </span>
              </div>

              {/* Status Text */}
              <div className="mt-1 text-[10px] font-bold tracking-wider min-h-[1.5em]" dir="rtl">
                {isOutOfStock ? (
                  <span
                    className={`${getStockStatusTextClass(stockStatus)} flex items-center gap-1`}
                  >
                    <PackageX className="w-3 h-3" />
                    {getStockStatusLabel(stockStatus)}
                  </span>
                ) : isLowStock ? (
                  <span
                    className={`${getStockStatusTextClass('low_stock')} flex items-center gap-1`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {product.trackQuantity && product.quantity
                      ? `تنها ${product.quantity} عدد`
                      : getStockStatusLabel('low_stock')}
                  </span>
                ) : isBackorder ? (
                  <span
                    className={`${getStockStatusTextClass('on_backorder')} flex items-center gap-1`}
                  >
                    <Clock className="w-3 h-3" />
                    {getStockStatusLabel('on_backorder')}
                  </span>
                ) : stockStatus === 'in_stock' ? (
                  <span
                    className={`${getStockStatusTextClass('in_stock')} flex items-center gap-1 opacity-60`}
                  >
                    <Check className="w-3 h-3" />
                    {getStockStatusLabel('in_stock')}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock || isAtMaxQuantity}
              className={`btn btn-ghost btn-circle btn-sm shadow-none border-none ${
                justAdded
                  ? 'btn-success text-white'
                  : isOutOfStock || isAtMaxQuantity
                    ? 'btn-disabled opacity-30'
                    : 'btn-ghost bg-base-200 hover:bg-primary hover:text-white'
              } transition-all duration-300 transform active:scale-90`}
              aria-label={
                isOutOfStock
                  ? 'ناموجود'
                  : isAtMaxQuantity
                    ? 'حداکثر موجودی در سبد است'
                    : 'افزودن به سبد'
              }
              title={
                isOutOfStock
                  ? 'ناموجود'
                  : isAtMaxQuantity
                    ? product.trackQuantity && product.quantity
                      ? `حداکثر ${maxQuantity} عدد در گدام موجود است`
                      : 'حداکثر مقدار مجاز'
                    : 'افزودن به سبد'
              }
            >
              {isAdding ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : justAdded ? (
                <Check className="w-4 h-4" />
              ) : isAtMaxQuantity ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}
