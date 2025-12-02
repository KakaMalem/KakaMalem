'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { Product } from '@/payload-types'
import { useCart } from '@/providers'
import { StarRating } from './StarRating'
import { formatPrice } from '@/utilities/currency'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
  size?: 'normal' | 'compact'
}

const placeholderImage = '/images/placeholder.jpg'

interface MediaObject {
  url?: string
  data?: {
    url?: string
  }
}

const getMediaUrl = (media?: string | MediaObject): string => {
  if (!media) return placeholderImage
  if (typeof media === 'string') return media
  if (typeof media === 'object' && 'url' in media && media.url) return media.url
  if (typeof media === 'object' && 'data' in media && media.data?.url) return media.data.url
  return placeholderImage
}

interface ImageWithAlt {
  image?: string | MediaObject
  alt?: string
}

interface ProductWithImageField extends Product {
  image?: Array<MediaObject & { alt?: string }>
}

const getProductImage = (product: Product): { url: string; alt: string } => {
  const productWithImage = product as ProductWithImageField
  const imageField = productWithImage.image

  if (Array.isArray(imageField) && imageField.length > 0) {
    const firstImage = imageField[0]
    return {
      url: getMediaUrl(firstImage),
      alt: firstImage.alt || product.name || 'Product image',
    }
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0]
    const imageWithAlt = firstImage as unknown as ImageWithAlt
    return {
      url: getMediaUrl(imageWithAlt.image || (firstImage as MediaObject)),
      alt: imageWithAlt.alt || product.name || 'Product image',
    }
  }

  return {
    url: placeholderImage,
    alt: product.name || 'Product image',
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, size: _size = 'normal' }) => {
  const { addItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const price: number = typeof product.price === 'number' ? product.price : 0
  const salePrice: number | undefined =
    typeof product.salePrice === 'number' ? product.salePrice : undefined
  const hasDiscount = typeof salePrice === 'number' && salePrice < price && price > 0
  const discount = hasDiscount ? Math.round(((price - (salePrice as number)) / price) * 100) : 0

  const productImage = getProductImage(product)
  const avgRating = typeof product.averageRating === 'number' ? product.averageRating : 0
  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0
  const totalSold = typeof product.totalSold === 'number' ? product.totalSold : 0
  const slug = product.slug ?? product.id

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
    e.stopPropagation()

    const isOutOfStock =
      product.stockStatus === 'out_of_stock' || product.stockStatus === 'discontinued'
    if (isAdding || justAdded || isOutOfStock) return

    setIsAdding(true)
    setError(null)

    try {
      // Use cart context - it handles both authenticated and guest users
      await addItem(product.id, 1)

      // Success - show checkmark and play sound
      setJustAdded(true)
      playSuccessSound()

      // Reset after 2 seconds
      setTimeout(() => {
        setJustAdded(false)
      }, 2000)
    } catch (error: unknown) {
      console.error('Error adding to cart:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to cart'
      setError(errorMessage)
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Link href={`/shop/${encodeURIComponent(slug)}`} className="block">
      <article className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 group h-full">
        <figure className="relative overflow-hidden aspect-square">
          <Image
            src={productImage.url}
            alt={productImage.alt}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hasDiscount && (
            <div className="badge badge-primary absolute top-2 left-2 font-bold text-xs md:text-sm">
              -{discount}%
            </div>
          )}
        </figure>

        <div className="card-body p-3 md:p-4 flex flex-col">
          <h3 className="card-title text-sm md:text-base group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]">
            {product.name}
          </h3>

          <div className="flex items-center justify-between gap-1 md:gap-2 mt-1">
            <div className="flex items-center gap-1 md:gap-2">
              <StarRating rating={avgRating} size="sm" />
              <span className="text-xs opacity-60">({reviewCount})</span>
            </div>
            {totalSold > 0 && (
              <span className="text-xs opacity-60 whitespace-nowrap">{totalSold} sold</span>
            )}
          </div>

          <div className="card-actions flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 mt-auto pt-2">
            <div className="flex-1">
              {hasDiscount ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-lg md:text-xl font-bold text-primary whitespace-nowrap">
                    {formatPrice(salePrice as number, product.currency)}
                  </span>
                  <span className="text-xs md:text-sm opacity-60 line-through">
                    {formatPrice(price, product.currency)}
                  </span>
                </div>
              ) : (
                <span className="text-lg md:text-xl font-bold whitespace-nowrap">
                  {formatPrice(price, product.currency)}
                </span>
              )}
            </div>

            <div className="relative w-full sm:w-auto">
              {product.stockStatus === 'out_of_stock' || product.stockStatus === 'discontinued' ? (
                <button
                  disabled
                  className="btn btn-sm w-full sm:w-auto btn-disabled text-xs"
                  title={product.stockStatus === 'discontinued' ? 'Discontinued' : 'Out of Stock'}
                >
                  {product.stockStatus === 'discontinued' ? 'Discontinued' : 'Out of Stock'}
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || justAdded}
                  className={`btn btn-sm w-full sm:w-auto ${
                    justAdded ? 'btn-success' : 'btn-primary'
                  } transition-all duration-300 min-h-[2.5rem] sm:min-h-[2rem]`}
                  aria-label={justAdded ? 'Added to cart' : 'Add to cart'}
                  title={justAdded ? 'Added to cart' : 'Add to cart'}
                >
                  {isAdding ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : justAdded ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Added</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Add to Cart</span>
                    </>
                  )}
                </button>
              )}
              {error && (
                <div className="absolute bottom-full mb-2 left-0 sm:right-0 sm:left-auto bg-error text-error-content text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                  {error}
                </div>
              )}
            </div>
          </div>

          {product.trackQuantity &&
            product.quantity !== null &&
            product.quantity !== undefined &&
            product.quantity <= 5 &&
            product.quantity > 0 && (
              <div className="text-xs text-warning mt-2 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-warning rounded-full"></span>
                Only {product.quantity} left!
              </div>
            )}
        </div>
      </article>
    </Link>
  )
}
