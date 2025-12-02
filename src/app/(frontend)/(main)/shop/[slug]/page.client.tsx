'use client'

import React, { useState, useEffect } from 'react'
import { Product, Media } from '@/payload-types'
import { Star, Plus, Minus, AlertCircle, Check, X, Heart } from 'lucide-react'
import { useCart } from '@/providers/cart'
import { useWishlist } from '@/providers/wishlist'
import { useRecentlyViewed } from '@/providers/recentlyViewed'
import { ReviewsSection } from '@/app/(frontend)/components/ReviewsSection'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatPrice } from '@/utilities/currency'

type Props = {
  product: Product
  descriptionHtml: string
}

interface ErrorWithMessage {
  message?: string
}

export default function ProductDetailsClient({ product, descriptionHtml }: Props) {
  const router = useRouter()
  const { addItem, loading: cartLoading, cart } = useCart()
  const { isInWishlist, toggleWishlist, loadingItems } = useWishlist()
  const { trackView } = useRecentlyViewed()

  // Client-side authentication check
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        })
        setIsAuthenticated(response.ok)
      } catch (_error) {
        setIsAuthenticated(false)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Track product view on mount
  useEffect(() => {
    trackView(product.id)
  }, [product.id, trackView])

  // Check if product is already in cart
  const cartItem = cart?.items?.find((item) => item.productId === product.id)
  const quantityInCart = cartItem?.quantity || 0

  const inWishlist = isInWishlist(product.id)
  const isWishlistLoading = loadingItems.has(product.id)

  // Handle images - they can be Media objects or string IDs
  const images = (product.images ?? [])
    .map((i: string | Media) => {
      if (typeof i === 'string') return i
      if (typeof i === 'object' && i?.url) return i.url
      return null
    })
    .filter(Boolean) as string[]

  const [selected, setSelected] = useState(0)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [buyNowLoading, setBuyNowLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stock availability helpers
  const isOutOfStock = !!(
    product.trackQuantity &&
    (product.quantity === 0 || product.quantity === null || product.quantity === undefined) &&
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
      ? Math.min(99, Math.max(0, product.quantity - quantityInCart))
      : 99

  const increase = () => setQty((q) => Math.min(maxQuantity, q + 1))
  const decrease = () => setQty((q) => Math.max(1, q - 1))

  // Helper function for error handling
  const handleError = (e: unknown, context: string) => {
    console.error(`Error in ${context}:`, e)

    let errorMessage = `Unable to ${context}. Please try again.`

    const error = e as ErrorWithMessage
    if (error?.message) {
      if (error.message.includes('stock') || error.message.includes('available')) {
        errorMessage = error.message
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message.includes('auth') || error.message.includes('login')) {
        errorMessage = 'Please log in to continue.'
      } else {
        errorMessage = error.message
      }
    }

    setError(errorMessage)
    toast.error(errorMessage)

    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000)
  }

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

  const addToCart = async () => {
    if (justAdded || cartLoading || buyNowLoading) return

    setError(null)

    try {
      await addItem(product.id, qty)

      // Success feedback
      setJustAdded(true)
      playSuccessSound()
      toast.success(`${qty} ${qty === 1 ? 'item' : 'items'} added to cart!`)

      // Reset quantity to 1 after successful add
      setQty(1)

      // Reset after 2 seconds
      setTimeout(() => setJustAdded(false), 2000)
    } catch (e: unknown) {
      handleError(e, 'add item to cart')
      // Reset quantity to available amount if stock error
      const error = e as ErrorWithMessage
      if (error?.message?.includes('available in stock')) {
        setQty(1)
      }
    }
  }

  const buyNow = async () => {
    if (cartLoading || buyNowLoading) return

    setError(null)
    setBuyNowLoading(true)

    try {
      await addItem(product.id, qty)

      // Brief success feedback before redirect
      toast.success('Redirecting to checkout...')

      // Small delay to ensure cart state is updated
      setTimeout(() => {
        router.push('/checkout')
      }, 300)
    } catch (e: unknown) {
      handleError(e, 'process your purchase')
      setBuyNowLoading(false)
      // Reset quantity to available amount if stock error
      const error = e as ErrorWithMessage
      if (error?.message?.includes('available in stock')) {
        setQty(1)
      }
    }
  }

  const handleWishlistToggle = async () => {
    try {
      await toggleWishlist(product.id)
      toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error: unknown) {
      console.error('Error toggling wishlist:', error)
      const err = error as ErrorWithMessage
      if (err.message?.includes('Unauthorized')) {
        toast.error('Please login to add to wishlist')
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`
      } else {
        toast.error(err.message || 'Failed to update wishlist')
      }
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
                  <button
                    key={String(i)}
                    onClick={() => setSelected(i)}
                    className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border transition-all duration-300 hover:scale-105 ${
                      selected === i ? 'border-primary' : 'border-base-200'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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

          {/* Product Description */}
          {descriptionHtml && (
            <div className="mt-6">
              <div className="prose prose-lg max-w-none">
                <h3 className="text-xl font-bold mb-4">Description</h3>
                <div
                  className="text-base-content/80 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            </div>
          )}

          {/* Product Specifications */}
          <div className="mt-6">
            <div className="prose max-w-none">
              <h3 className="text-xl font-bold mb-4">Specifications</h3>
              <div className="bg-base-200 rounded-lg overflow-hidden">
                <table className="table table-zebra w-full">
                  <tbody>
                    {product.sku && (
                      <tr>
                        <td className="font-medium">SKU</td>
                        <td>{product.sku}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="font-medium">Availability</td>
                      <td>
                        <span
                          className={`badge badge-sm ${
                            product.stockStatus === 'in_stock'
                              ? 'badge-success'
                              : product.stockStatus === 'low_stock'
                                ? 'badge-warning'
                                : product.stockStatus === 'on_backorder'
                                  ? 'badge-info'
                                  : 'badge-error'
                          }`}
                        >
                          {product.stockStatus === 'in_stock'
                            ? 'In Stock'
                            : product.stockStatus === 'out_of_stock'
                              ? 'Out of Stock'
                              : product.stockStatus === 'low_stock'
                                ? 'Low Stock'
                                : product.stockStatus === 'on_backorder'
                                  ? 'On Backorder'
                                  : product.stockStatus === 'discontinued'
                                    ? 'Discontinued'
                                    : 'N/A'}
                        </span>
                      </td>
                    </tr>
                    {product.trackQuantity && product.quantity > 0 && (
                      <tr>
                        <td className="font-medium">Stock Quantity</td>
                        <td>{product.quantity} units available</td>
                      </tr>
                    )}
                    <tr>
                      <td className="font-medium">Shipping</td>
                      <td>
                        {product.requiresShipping
                          ? 'Physical product - shipping required'
                          : 'Digital product - no shipping'}
                      </td>
                    </tr>
                    {product.allowBackorders && (
                      <tr>
                        <td className="font-medium">Backorders</td>
                        <td>Accepted - order now, ship when available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                {product.reviewCount && product.reviewCount > 0 && (
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
                    {formatPrice(product.salePrice, product.currency)}
                  </div>
                  <div className="text-sm line-through text-base-content/50">
                    {formatPrice(product.price, product.currency)}
                  </div>
                  <div className="text-sm text-success font-medium">
                    Save{' '}
                    {formatPrice(
                      Number(product.price) - Number(product.salePrice),
                      product.currency,
                    )}
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold">
                  {formatPrice(product.price, product.currency)}
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
            <div className="space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="join border border-base-300 rounded-lg">
                  <button
                    onClick={decrease}
                    className="btn btn-sm join-item border-none"
                    disabled={qty <= 1 || isOutOfStock || buyNowLoading || cartLoading}
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
                    disabled={qty >= maxQuantity || isOutOfStock || buyNowLoading || cartLoading}
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
                  disabled={cartLoading || buyNowLoading || justAdded || isOutOfStock}
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
                  disabled={cartLoading || buyNowLoading || isOutOfStock}
                >
                  {buyNowLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Processing...
                    </>
                  ) : (
                    'Buy now'
                  )}
                </button>
              </div>

              {/* Wishlist button */}
              <button
                onClick={handleWishlistToggle}
                disabled={isWishlistLoading}
                className={`btn btn-outline w-full ${
                  inWishlist ? 'btn-error' : ''
                } transition-all duration-300`}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isWishlistLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Heart
                      className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`}
                      strokeWidth={inWishlist ? 0 : 2}
                    />
                    <span>{inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</span>
                  </>
                )}
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

            {/* Key Information */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-3 text-sm border border-base-300">
              {product.requiresShipping && (
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
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-base-content">Shipping Available</p>
                    <p className="text-base-content/70">Fast delivery to your location</p>
                  </div>
                </div>
              )}

              {product.allowBackorders && (
                <>
                  <div className="divider my-1"></div>
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-info flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-base-content">Backorders Accepted</p>
                      <p className="text-base-content/70">Order now, ship when available</p>
                    </div>
                  </div>
                </>
              )}

              <div className="divider my-1"></div>
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-base-content">Secure Checkout</p>
                  <p className="text-base-content/70">Safe and encrypted payment</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mt-16 scroll-mt-24">
        {authLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <span className="ml-3">Loading reviews...</span>
          </div>
        ) : (
          <ReviewsSection productId={product.id} isAuthenticated={isAuthenticated} />
        )}
      </div>
    </>
  )
}
