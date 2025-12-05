'use client'

import React from 'react'
import { X, Plus, Minus } from 'lucide-react'
import type { PopulatedCartItem } from '@/endpoints/cart/types'
import { formatPrice } from '@/utilities/currency'
import Link from 'next/link'
import type { Media } from '@/payload-types'

interface CartItemProps {
  item: PopulatedCartItem
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>
  onRemove: (productId: string, variantId?: string) => Promise<void>
  loading?: boolean
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  loading = false,
}) => {
  const { product, variant, quantity, productId, variantId } = item

  // Get the appropriate price
  const price = variant?.price || product.salePrice || product.price || 0
  const compareAtPrice = variant?.compareAtPrice || product.price || null

  // Get the appropriate image - variant image first, then product image
  const getImage = (): string | null => {
    // Try variant images first
    if (variant?.images && Array.isArray(variant.images) && variant.images.length > 0) {
      const firstImage = variant.images[0]
      if (typeof firstImage === 'string') return firstImage
      if (typeof firstImage === 'object' && (firstImage as Media)?.url) {
        return (firstImage as Media).url ?? null
      }
    }

    // Fall back to product images
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0]
      if (typeof firstImage === 'string') return firstImage
      if (typeof firstImage === 'object' && (firstImage as Media)?.url) {
        return (firstImage as Media).url ?? null
      }
    }

    return null
  }

  const imageUrl = getImage()

  // Get variant details for display
  const variantLabel = variant?.options?.map((opt) => `${opt.name}: ${opt.value}`).join(', ')

  // Check stock status
  const stockSource = variant || product
  const maxQuantity =
    stockSource.trackQuantity && stockSource.quantity !== null && stockSource.quantity !== undefined
      ? stockSource.quantity
      : 99

  const isOutOfStock = !!(
    stockSource.trackQuantity &&
    (stockSource.quantity === 0 ||
      stockSource.quantity === null ||
      stockSource.quantity === undefined) &&
    !stockSource.allowBackorders
  )

  const handleIncrease = async () => {
    if (loading || quantity >= maxQuantity) return
    await onUpdateQuantity(productId, quantity + 1, variantId)
  }

  const handleDecrease = async () => {
    if (loading || quantity <= 1) return
    await onUpdateQuantity(productId, quantity - 1, variantId)
  }

  const handleRemove = async () => {
    if (loading) return
    await onRemove(productId, variantId)
  }

  return (
    <div className="flex gap-4 py-4 border-b border-base-300 last:border-b-0">
      {/* Product Image */}
      <Link
        href={`/shop/${product.slug}`}
        className="flex-shrink-0 w-20 h-20 bg-base-200 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/30 text-xs">
            No image
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="flex-1">
            <Link
              href={`/shop/${product.slug}`}
              className="font-medium text-base-content hover:text-primary transition-colors line-clamp-1"
            >
              {product.name}
            </Link>

            {/* Variant Options */}
            {variantLabel && <p className="text-sm text-base-content/60 mt-1">{variantLabel}</p>}

            {/* SKU if available */}
            {variant?.sku && (
              <p className="text-xs text-base-content/40 mt-0.5 font-mono">{variant.sku}</p>
            )}

            {/* Stock Warning */}
            {isOutOfStock && <p className="text-xs text-error mt-1">Out of stock</p>}
            {!isOutOfStock &&
              stockSource.trackQuantity &&
              stockSource.quantity &&
              stockSource.quantity <= 5 && (
                <p className="text-xs text-warning mt-1">Only {stockSource.quantity} left</p>
              )}
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={loading}
            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-error"
            aria-label="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price and Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="join border border-base-300 rounded-md">
            <button
              onClick={handleDecrease}
              disabled={loading || quantity <= 1}
              className="btn btn-xs join-item border-none"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <div className="join-item flex items-center justify-center min-w-[40px] px-2 text-sm font-medium">
              {quantity}
            </div>
            <button
              onClick={handleIncrease}
              disabled={loading || quantity >= maxQuantity || isOutOfStock}
              className="btn btn-xs join-item border-none"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            {compareAtPrice && compareAtPrice > price ? (
              <div className="flex items-center gap-2">
                <span className="text-xs line-through text-base-content/40">
                  {formatPrice(compareAtPrice * quantity, product.currency)}
                </span>
                <span className="text-sm font-semibold text-primary">
                  {formatPrice(price * quantity, product.currency)}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-base-content">
                {formatPrice(price * quantity, product.currency)}
              </span>
            )}
            {quantity > 1 && (
              <p className="text-xs text-base-content/60 mt-0.5">
                {formatPrice(price, product.currency)} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
