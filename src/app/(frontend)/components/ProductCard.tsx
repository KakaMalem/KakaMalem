'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check } from 'lucide-react'
import { Product } from '@/payload-types'
import { useCart } from '@/providers'

interface ProductCardProps {
  product: Product
  size?: 'normal' | 'compact'
}

const placeholderImage = '/images/placeholder.jpg'

const getMediaUrl = (media?: string | { url?: string } | any): string => {
  if (!media) return placeholderImage
  if (typeof media === 'string') return media
  if (typeof media === 'object' && media.url) return media.url
  return media.data?.url ?? placeholderImage
}

const getProductImage = (product: Product): { url: string; alt: string } => {
  const imageField = (product as any).image
  if (Array.isArray(imageField) && imageField.length > 0) {
    const firstImage = imageField[0]
    return {
      url: getMediaUrl(firstImage),
      alt: firstImage.alt || product.name || 'Product image',
    }
  }

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const firstImage = product.images[0]
    return {
      url: getMediaUrl((firstImage as any).image || firstImage),
      alt: (firstImage as any).alt || product.name || 'Product image',
    }
  }

  return {
    url: placeholderImage,
    alt: product.name || 'Product image',
  }
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, size = 'normal' }) => {
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
  const slug = product.slug ?? product.id

  // Play success sound - a pleasant two-tone beep
  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

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

    if (isAdding || justAdded || product.status === 'out_of_stock') return

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
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      setError(error.message || 'Failed to add to cart')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <article className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 group">
      <Link href={`/shop/${slug}`} className="block">
        <figure className="relative overflow-hidden aspect-square">
          <img
            src={productImage.url}
            alt={productImage.alt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hasDiscount && (
            <div className="badge badge-primary absolute top-3 left-3 font-bold">-{discount}%</div>
          )}
          {product.status === 'out_of_stock' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="badge badge-error badge-lg">Out of Stock</span>
            </div>
          )}
        </figure>
      </Link>

      <div className="card-body p-4">
        <h3 className="card-title text-base group-hover:text-primary transition-colors line-clamp-2">
          <Link href={`/shop/${slug}`} className="inline-block">
            {product.name}
          </Link>
        </h3>

        {product.shortDescription && size === 'normal' && (
          <p className="text-sm opacity-70 line-clamp-2">{product.shortDescription}</p>
        )}

        {avgRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="rating rating-sm" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <input
                  key={i}
                  type="radio"
                  className={`mask mask-star-2 ${i < Math.floor(avgRating) ? 'bg-accent' : 'bg-base-300'}`}
                  disabled
                />
              ))}
            </div>
            <span className="text-xs opacity-60">({reviewCount})</span>
          </div>
        )}

        <div className="card-actions justify-between items-center mt-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">
                  {product.currency} {salePrice}
                </span>
                <span className="text-sm opacity-60 line-through">
                  {product.currency} {price}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold">
                {product.currency} {price}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || justAdded || product.status === 'out_of_stock'}
              className={`btn btn-sm ${
                justAdded ? 'btn-success' : 'btn-primary'
              } transition-all duration-300`}
              aria-label={justAdded ? 'Added to cart' : 'Add to cart'}
              title={justAdded ? 'Added to cart' : 'Add to cart'}
            >
              {isAdding ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : justAdded ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
            {error && (
              <div className="absolute bottom-full mb-2 right-0 bg-error text-error-content text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {product.trackQuantity && product.quantity <= 5 && product.quantity > 0 && (
          <div className="text-xs text-warning mt-2">Only {product.quantity} left in stock!</div>
        )}
      </div>
    </article>
  )
}
