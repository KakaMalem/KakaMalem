'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRecentlyViewed } from '@/providers/recentlyViewed'
import { Star } from 'lucide-react'
import { formatPrice } from '@/utilities/currency'
import type { Product } from '@/payload-types'

interface RecentlyViewedProps {
  showTitle?: boolean
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ showTitle = true }) => {
  const { recentlyViewed, guestItems, isLoading, isAuthenticated } = useRecentlyViewed()
  const [guestProducts, setGuestProducts] = useState<Product[]>([])
  const [loadingGuest, setLoadingGuest] = useState(false)

  // Fetch product details for guest items
  useEffect(() => {
    if (isAuthenticated === false && guestItems.length > 0) {
      const fetchGuestProducts = async () => {
        setLoadingGuest(true)
        try {
          // Fetch products by IDs
          const productIds = guestItems.map((item) => item.productId).slice(0, 10)

          const response = await fetch(
            `/api/search-products?ids=${productIds.join(',')}&limit=${productIds.length}`,
          )

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.products) {
              // Sort by guest view order
              const sortedProducts = productIds
                .map((id) => data.products.find((p: Product) => p.id === id))
                .filter((p): p is Product => p !== undefined)
              setGuestProducts(sortedProducts)
            }
          }
        } catch (error) {
          console.error('Error fetching guest products:', error)
        } finally {
          setLoadingGuest(false)
        }
      }

      fetchGuestProducts()
    } else {
      setGuestProducts([])
    }
  }, [guestItems, isAuthenticated])

  if (isLoading || loadingGuest) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // Determine which data to show
  const productsToShow =
    isAuthenticated === false ? guestProducts : recentlyViewed.map((item) => item.product)

  if (productsToShow.length === 0) {
    // If showTitle is false (used in account page), show empty state
    if (!showTitle) {
      return (
        <div className="text-center py-12">
          <div className="text-base-content/30 mb-2">هنوز محصولی مشاهده نکرده‌اید</div>
          <p className="text-sm text-base-content/60">
            محصولاتی که مشاهده می‌کنید اینجا نمایش داده می‌شوند
          </p>
        </div>
      )
    }
    // Otherwise return null (hide entire section on homepage)
    return null
  }

  return (
    <div className="space-y-4">
      {showTitle && <h2 className="text-2xl font-bold">اخیراً مشاهده شده</h2>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {productsToShow.map((product) => {
          const productWithVariant = product as Product & {
            hasVariants?: boolean
            defaultVariantImages?: Array<string | { url?: string }>
            defaultVariantPrice?: number
            defaultVariantCompareAtPrice?: number
          }

          // Get first image - prioritize variant images if product has variants
          let image: string | null = null

          if (
            productWithVariant.hasVariants &&
            productWithVariant.defaultVariantImages &&
            Array.isArray(productWithVariant.defaultVariantImages) &&
            productWithVariant.defaultVariantImages.length > 0
          ) {
            const firstVariantImage = productWithVariant.defaultVariantImages[0]
            if (typeof firstVariantImage === 'string') {
              image = firstVariantImage
            } else if (
              typeof firstVariantImage === 'object' &&
              firstVariantImage &&
              'url' in firstVariantImage
            ) {
              image = firstVariantImage.url || null
            }
          } else if (product.images && product.images.length > 0) {
            const firstImage = product.images[0]
            if (typeof firstImage === 'string') {
              image = firstImage
            } else if (typeof firstImage === 'object' && 'url' in firstImage) {
              image = (firstImage as { url?: string }).url || null
            }
          }

          // Calculate display price - use variant price if available
          const basePrice: number =
            productWithVariant.hasVariants && productWithVariant.defaultVariantPrice !== undefined
              ? productWithVariant.defaultVariantPrice
              : typeof product.price === 'number'
                ? product.price
                : 0

          const comparePrice: number | undefined =
            productWithVariant.hasVariants &&
            productWithVariant.defaultVariantCompareAtPrice !== undefined
              ? productWithVariant.defaultVariantCompareAtPrice
              : typeof product.salePrice === 'number'
                ? product.salePrice
                : undefined

          let displayPrice: number
          let originalPrice: number | undefined

          if (productWithVariant.hasVariants && comparePrice !== undefined) {
            displayPrice = basePrice
            originalPrice = comparePrice
          } else if (!productWithVariant.hasVariants && comparePrice !== undefined) {
            displayPrice = comparePrice
            originalPrice = basePrice
          } else {
            displayPrice = basePrice
          }

          return (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <figure className="aspect-square bg-base-200">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={product.name}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-base-content/30">
                    بدون تصویر
                  </div>
                )}
              </figure>

              {/* Content */}
              <div className="card-body p-3">
                <h3 className="card-title text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-1">
                  <Star
                    className={`w-3 h-3 ${
                      typeof product.averageRating === 'number' && product.averageRating > 0
                        ? 'fill-rating text-rating'
                        : 'text-base-300'
                    }`}
                  />
                  <span className="text-xs opacity-70">
                    {typeof product.averageRating === 'number'
                      ? product.averageRating.toFixed(1)
                      : 'بدون امتیاز'}
                    {typeof product.reviewCount === 'number' && product.reviewCount > 0
                      ? ` (${product.reviewCount})`
                      : ''}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <div className="font-bold text-primary">
                    {formatPrice(displayPrice, product.currency)}
                  </div>
                  {originalPrice && displayPrice < originalPrice && (
                    <div className="text-xs line-through opacity-50">
                      {formatPrice(originalPrice, product.currency)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
