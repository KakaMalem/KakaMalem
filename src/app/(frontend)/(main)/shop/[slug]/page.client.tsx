'use client'

import React, { useState } from 'react'
import { Product } from '@/payload-types'
import { Star, Plus, Minus, AlertCircle, Check, X } from 'lucide-react'
import { useCart } from '@/providers/cart'
import { ReviewsSection } from '@/app/(frontend)/components/ReviewsSection'

type Props = {
  product: Product
  isAuthenticated: boolean
}

export default function ProductDetailsClient({ product, isAuthenticated }: Props) {
  const { addItem, loading: cartLoading } = useCart()

  // Handle images - they can be Media objects or string IDs
  const images = (product.images ?? [])
    .map((i: any) => {
      if (typeof i === 'string') return i
      if (i?.url) return i.url
      return null
    })
    .filter(Boolean) as string[]

  const [selected, setSelected] = useState(0)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stock availability helpers
  const isOutOfStock = !!(
    product.trackQuantity &&
    product.quantity === 0 &&
    !product.allowBackorders
  )
  const isLowStock = !!(
    product.trackQuantity &&
    !product.allowBackorders &&
    product.quantity &&
    product.quantity <= 5 &&
    product.quantity > 0
  )
  const maxQuantity =
    product.trackQuantity && product.quantity && !product.allowBackorders
      ? Math.min(99, product.quantity)
      : 99

  const increase = () => setQty((q) => Math.min(maxQuantity, q + 1))
  const decrease = () => setQty((q) => Math.max(1, q - 1))

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

  const addToCart = async () => {
    if (justAdded || cartLoading) return

    // Clear any previous errors
    setError(null)

    try {
      await addItem(product.id, qty)

      // Success - show checkmark and play sound
      setJustAdded(true)
      playSuccessSound()

      // Reset after 2 seconds
      setTimeout(() => {
        setJustAdded(false)
      }, 2000)
    } catch (e: any) {
      console.error('Error adding to cart:', e)

      // Set user-friendly error message
      let errorMessage = 'Unable to add item to cart. Please try again.'

      if (e?.message) {
        // Check for specific error types
        if (e.message.includes('stock') || e.message.includes('available')) {
          errorMessage = e.message
        } else if (e.message.includes('network') || e.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (e.message.includes('auth') || e.message.includes('login')) {
          errorMessage = 'Please log in to add items to your cart.'
        } else {
          errorMessage = e.message
        }
      }

      setError(errorMessage)

      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }

  const buyNow = async () => {
    // Clear any previous errors
    setError(null)

    try {
      await addItem(product.id, qty)
      // Navigate to cart after successfully adding
      window.location.href = '/cart'
    } catch (e: any) {
      console.error('Error in Buy Now:', e)

      // Set user-friendly error message
      let errorMessage = 'Unable to process your request. Please try again.'

      if (e?.message) {
        // Check for specific error types
        if (e.message.includes('stock') || e.message.includes('available')) {
          errorMessage = e.message
        } else if (e.message.includes('network') || e.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (e.message.includes('auth') || e.message.includes('login')) {
          errorMessage = 'Please log in to continue with your purchase.'
        } else {
          errorMessage = e.message
        }
      }

      setError(errorMessage)

      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null)
      }, 5000)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Images (lg: span 7) */}
        <div className="lg:col-span-7">
          <div className="bg-base-200 rounded-md p-4 transition-all duration-300 hover:shadow-2xl">
            {/* Main image */}
            <div className="w-full aspect-[4/3] rounded-md overflow-hidden flex items-center justify-center">
              {images[selected] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={images[selected]}
                  alt={
                    typeof product.images?.[selected] === 'object' &&
                    product.images?.[selected]?.alt
                      ? product.images[selected].alt
                      : product.name
                  }
                  className="object-contain w-full h-full hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="text-center text-sm text-base-content/50">No image available</div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <button
                    key={String(i)}
                    onClick={() => setSelected(i)}
                    className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border transition-all duration-300 hover:scale-105 ${
                      selected === i ? 'border-primary' : 'border-base-200'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} ${i}`}
                      className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="mt-6">
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold mb-4">Product Details</h3>
              <div className="bg-base-200 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">SKU:</span>
                  <span className="text-base-content/70">{product.id}</span>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="badge badge-sm">{product.status ?? 'N/A'}</span>
                </div>
                {product.trackQuantity && (
                  <>
                    <div className="divider my-1"></div>
                    <div className="flex justify-between">
                      <span className="font-medium">Stock:</span>
                      <span className="text-base-content/70">
                        {product.quantity ? `${product.quantity} available` : 'Out of stock'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details + actions (lg: span 5) */}
        <aside className="lg:col-span-5">
          <div className="space-y-4 sticky top-24">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {/* Rating summary */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-orange-400">
                  <Star size={18} fill="currentColor" />
                  <span className="font-semibold text-base-content">
                    {product.averageRating ? product.averageRating.toFixed(1) : 'No ratings'}
                  </span>
                </div>
                {product.reviewCount > 0 && (
                  <>
                    <span className="text-base-content/40">•</span>
                    <a
                      href="#reviews"
                      className="text-sm text-base-content/70 hover:text-primary transition-colors"
                    >
                      {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                    </a>
                  </>
                )}
              </div>
              {product.shortDescription && (
                <p className="text-base-content/70 mt-3 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}
            </div>

            <div className="flex items-baseline gap-4">
              {product.salePrice ? (
                <>
                  <div className="text-2xl font-bold">
                    {product.currency} {product.salePrice}
                  </div>
                  <div className="text-sm line-through text-base-content/50">
                    {product.currency} {product.price}
                  </div>
                  <div className="text-sm text-success font-medium">
                    Save {product.currency} {Number(product.price) - Number(product.salePrice)}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold">
                  {product.currency} {product.price}
                </div>
              )}
            </div>

            {/* Stock warnings */}
            {isLowStock && (
              <div className="text-sm text-warning flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Only {product.quantity} left in stock
              </div>
            )}
            {isOutOfStock && (
              <div className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Out of stock
              </div>
            )}
            {product.trackQuantity && product.quantity === 0 && product.allowBackorders && (
              <div className="text-sm text-info flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Currently out of stock - available for back order
              </div>
            )}
            {product.trackQuantity &&
              product.allowBackorders &&
              product.quantity &&
              product.quantity > 0 &&
              product.quantity <= 5 && (
                <div className="text-sm text-info flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Only {product.quantity} in stock - back orders available
                </div>
              )}

            {/* Quantity selector and action buttons */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="join border border-base-300 rounded-lg">
                <button
                  onClick={decrease}
                  className="btn btn-sm join-item border-none"
                  disabled={qty <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="join-item flex items-center justify-center min-w-[50px] px-3 font-semibold text-base">
                  {qty}
                </div>
                <button
                  onClick={increase}
                  className="btn btn-sm join-item border-none"
                  disabled={qty >= maxQuantity || isOutOfStock}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={addToCart}
                className={`btn ${
                  justAdded ? 'btn-success' : 'btn-primary'
                } px-6 transition-all duration-300`}
                disabled={cartLoading || justAdded || isOutOfStock}
                aria-label={justAdded ? 'Added to cart' : 'Add to cart'}
              >
                {cartLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : justAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added!</span>
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  'Add to cart'
                )}
              </button>

              <button
                onClick={buyNow}
                className="btn btn-outline px-4 transition-all duration-300"
                disabled={cartLoading || isOutOfStock}
              >
                Buy now
              </button>
            </div>

            {/* Error message alert */}
            {error && (
              <div className="alert alert-error shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3 w-full">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Error</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="btn btn-sm btn-ghost btn-circle"
                    aria-label="Close error message"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Shipping info */}
            <div className="bg-base-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                <div>
                  <p className="font-medium">Fast Shipping</p>
                  <p className="text-base-content/70">Ships within 1–3 business days</p>
                </div>
              </div>
              <div className="divider my-1"></div>
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                  />
                </svg>
                <div>
                  <p className="font-medium">Easy Returns</p>
                  <p className="text-base-content/70">Returns accepted within 14 days</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mt-16 scroll-mt-24">
        <ReviewsSection productId={product.id} isAuthenticated={isAuthenticated} />
      </div>
    </>
  )
}
