'use client'

import React, { useState, useEffect } from 'react'
import { Product, Media, ProductVariant, Category } from '@/payload-types'
import { Star, Plus, Minus, AlertCircle, Check, X } from 'lucide-react'
import { useCart } from '@/providers/cart'
import { useRecentlyViewed } from '@/providers/recentlyViewed'
import { ReviewsSection } from '@/app/(frontend)/components/ReviewsSection'
import { HybridProductGallery } from '@/app/(frontend)/components/HybridProductGallery'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatPrice } from '@/utilities/currency'
import Image from 'next/image'
import { Breadcrumb, type BreadcrumbItem } from '@/app/(frontend)/components/Breadcrumb'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

type Props = {
  product: Product
  descriptionHtml: string
}

interface ErrorWithMessage {
  message?: string
}

export default function ProductDetailsClient({ product, descriptionHtml }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem, loading: cartLoading, cart } = useCart()
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

  // Fetch variants if product has variants
  useEffect(() => {
    const fetchVariants = async () => {
      if (!product.hasVariants) {
        console.log('Product does not have variants enabled')
        return
      }

      console.log('Fetching variants for product:', product.id, 'hasVariants:', product.hasVariants)
      setVariantsLoading(true)
      try {
        const response = await fetch(`/api/variants/product/${product.id}`)
        console.log('Variants response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Variants data received:', data)
          const fetchedVariants = data.data || []
          console.log(
            'Fetched variants count:',
            fetchedVariants.length,
            'Variants:',
            fetchedVariants,
          )
          setVariants(fetchedVariants)

          // Check URL for variant ID, otherwise use default variant
          const urlVariantId = searchParams.get('variant')
          let variantToSelect: ProductVariant | null = null

          if (urlVariantId) {
            // Try to find variant from URL
            variantToSelect = fetchedVariants.find((v: ProductVariant) => v.id === urlVariantId)
            console.log('Variant from URL:', variantToSelect)
          }

          // If no variant from URL or not found, use default or first variant
          if (!variantToSelect) {
            variantToSelect =
              fetchedVariants.find((v: ProductVariant) => v.isDefault) || fetchedVariants[0]
            console.log('Default variant:', variantToSelect)
          }

          if (variantToSelect) {
            setSelectedVariant(variantToSelect)
            // Build selected options from variant
            const options: Record<string, string> = {}
            variantToSelect.options?.forEach((opt: { name: string; value: string }) => {
              options[opt.name] = opt.value
            })
            console.log('Selected options:', options)
            setSelectedOptions(options)

            // Update URL with variant ID if not already set
            if (!urlVariantId || urlVariantId !== variantToSelect.id) {
              const url = new URL(window.location.href)
              url.searchParams.set('variant', variantToSelect.id)
              router.replace(url.pathname + url.search, { scroll: false })
            }

            // Update images if variant has specific images
            if (
              variantToSelect.images &&
              Array.isArray(variantToSelect.images) &&
              variantToSelect.images.length > 0
            ) {
              const variantImages = variantToSelect.images
                .map((img: string | Media) => {
                  if (typeof img === 'string') return img
                  if (typeof img === 'object' && img?.url) return img.url
                  return null
                })
                .filter(Boolean) as string[]
              if (variantImages.length > 0) {
                setSelected(0) // Reset to first image
              }
            }
          }
        } else {
          console.error('Failed to fetch variants, status:', response.status)
          const errorData = await response.json()
          console.error('Error data:', errorData)
        }
      } catch (error) {
        console.error('Error fetching variants:', error)
        toast.error('Failed to load product variants')
      } finally {
        setVariantsLoading(false)
      }
    }

    fetchVariants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.hasVariants, searchParams])

  // Check if product is already in cart
  const cartItem = cart?.items?.find((item) => item.productId === product.id)
  const quantityInCart = cartItem?.quantity || 0

  // State declarations - must be before any usage
  const [_selected, setSelected] = useState(0)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Variant state
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  // Handle images - use variant images if available, never product images if default variant has images
  const getImages = () => {
    // Check if there's a default variant with images
    const defaultVariant = variants.find((v) => v.isDefault)
    const defaultHasImages =
      defaultVariant?.images &&
      Array.isArray(defaultVariant.images) &&
      defaultVariant.images.length > 0

    // If variant is selected and has images, use those
    if (
      selectedVariant?.images &&
      Array.isArray(selectedVariant.images) &&
      selectedVariant.images.length > 0
    ) {
      return selectedVariant.images
        .map((i: string | Media) => {
          if (typeof i === 'string') return i
          if (typeof i === 'object' && i?.url) return i.url
          return null
        })
        .filter(Boolean) as string[]
    }

    // If there's a default variant with images, NEVER show product images
    // This ensures variant images take precedence completely
    if (product.hasVariants && defaultHasImages) {
      return []
    }

    // Otherwise use product images (only if no default variant with images exists)
    return (product.images ?? [])
      .map((i: string | Media) => {
        if (typeof i === 'string') return i
        if (typeof i === 'object' && i?.url) return i.url
        return null
      })
      .filter(Boolean) as string[]
  }

  const images = getImages()

  // Stock availability helpers - use variant stock if selected, otherwise product stock
  const stockSource = selectedVariant || product
  const isOutOfStock = !!(
    stockSource.trackQuantity &&
    (stockSource.quantity === 0 ||
      stockSource.quantity === null ||
      stockSource.quantity === undefined) &&
    !stockSource.allowBackorders
  )
  const isLowStock = !!(
    stockSource.trackQuantity &&
    !stockSource.allowBackorders &&
    stockSource.quantity &&
    stockSource.quantity <= 5 &&
    stockSource.quantity > 0
  )
  const maxQuantity =
    stockSource.trackQuantity && stockSource.quantity && !stockSource.allowBackorders
      ? Math.min(99, Math.max(0, stockSource.quantity - quantityInCart))
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
    if (justAdded || cartLoading) return

    // Check if variant is required but not selected
    if (product.hasVariants && !selectedVariant) {
      toast.error('Please select all product options')
      return
    }

    setError(null)

    try {
      await addItem(product.id, qty, selectedVariant?.id)

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

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = []

  // Add category if available
  if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
    const category = product.categories[0]
    if (typeof category === 'object' && 'name' in category && 'slug' in category) {
      breadcrumbItems.push({
        label: (category as Category).name,
        href: `/category/${(category as Category).slug}`,
      })
    }
  }

  // Add product name (current page)
  breadcrumbItems.push({
    label: product.name,
    active: true,
  })

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Product Name - Above everything (mobile only) */}
      <div className="mb-3 lg:hidden">
        <h1 className="text-xl font-normal">{product.name}</h1>
      </div>

      {/* Rating summary - Mobile only, right below title */}
      <div className="flex items-center gap-2 mb-4 lg:hidden">
        <div className="flex items-center gap-1 text-orange-400">
          <Star size={16} fill="currentColor" />
          <span className="font-semibold text-base-content text-sm">
            {product.averageRating ? product.averageRating.toFixed(1) : 'No ratings'}
          </span>
        </div>
        {product.reviewCount && product.reviewCount > 0 && (
          <>
            <span className="text-base-content/40 text-sm">•</span>
            <a
              href="#reviews"
              className="text-xs text-base-content/70 hover:text-primary transition-colors"
            >
              {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
            </a>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-12">
        {/* Left: Images */}
        <div>
          <HybridProductGallery
            images={images.length > 0 ? images : [PLACEHOLDER_IMAGE]}
            productName={product.name}
          />
        </div>

        {/* Right: Details + actions */}
        <aside>
          <div className="space-y-3 sm:space-y-4 lg:sticky lg:top-24">
            <div>
              {/* Product Name (desktop only) */}
              <h1 className="hidden lg:block text-2xl font-normal mb-2">{product.name}</h1>
              {/* Rating summary - Desktop only */}
              <div className="hidden lg:flex items-center gap-2 sm:gap-3">
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
                <p className="hidden lg:block text-base-content/70 mt-3 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Price - Desktop only (shown here) */}
            <div className="hidden lg:flex items-baseline gap-4">
              {(() => {
                if (selectedVariant?.price) {
                  // Variant has custom price
                  return selectedVariant.compareAtPrice ? (
                    <>
                      <div className="text-2xl font-bold">
                        {formatPrice(selectedVariant.price, product.currency)}
                      </div>
                      <div className="text-sm line-through text-base-content/50">
                        {formatPrice(selectedVariant.compareAtPrice, product.currency)}
                      </div>
                      <div className="text-sm text-success font-medium">
                        Save{' '}
                        {formatPrice(
                          Number(selectedVariant.compareAtPrice) - Number(selectedVariant.price),
                          product.currency,
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold">
                      {formatPrice(selectedVariant.price, product.currency)}
                    </div>
                  )
                } else if (product.salePrice) {
                  // Product sale price
                  return (
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
                  )
                } else {
                  // Regular product price
                  return (
                    <div className="text-2xl font-bold">
                      {formatPrice(product.price, product.currency)}
                    </div>
                  )
                }
              })()}
            </div>

            {/* Variant Selector - Moved up for better mobile UX */}
            {(() => {
              const shouldShow =
                product.hasVariants &&
                product.variantOptions &&
                product.variantOptions.length > 0 &&
                variants.length > 0
              return shouldShow
            })() && (
              <div className="space-y-3 sm:space-y-4 border-t border-b border-base-300 py-3 sm:py-4">
                {variantsLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    <span className="text-sm text-base-content/70">Loading options...</span>
                  </div>
                ) : (
                  product.variantOptions?.map((option) => (
                    <div key={option.name} className="space-y-2">
                      <label className="text-sm font-medium text-base-content">
                        {option.name}:
                        {selectedOptions[option.name] && (
                          <span className="ml-2 text-primary">{selectedOptions[option.name]}</span>
                        )}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {option.values?.map((val) => {
                          const isSelected = selectedOptions[option.name] === val.value

                          // Check if this option value is available
                          const isAvailable =
                            variants.length === 0 ||
                            variants.some((v) => {
                              // Check if this option value exists in this variant
                              const hasOption = v.options?.some(
                                (opt) => opt.name === option.name && opt.value === val.value,
                              )
                              if (!hasOption) return false

                              // Get other selected options (excluding current option)
                              const otherSelectedOptions = Object.entries(selectedOptions).filter(
                                ([key]) => key !== option.name,
                              )

                              // If no other options are selected yet, this option is available
                              if (otherSelectedOptions.length === 0) return true

                              // Check if all other selected options match this variant
                              return otherSelectedOptions.every(([key, value]) => {
                                return v.options?.some(
                                  (opt) => opt.name === key && opt.value === value,
                                )
                              })
                            })

                          {
                            // Get image URL if exists
                            const imageUrl =
                              val.image && typeof val.image === 'object' && 'url' in val.image
                                ? val.image.url
                                : null

                            return (
                              <button
                                key={val.value}
                                onClick={() => {
                                  const newOptions = {
                                    ...selectedOptions,
                                    [option.name]: val.value,
                                  }
                                  setSelectedOptions(newOptions)

                                  // Find matching variant
                                  const matchingVariant = variants.find((v) => {
                                    return Object.entries(newOptions).every(([key, value]) => {
                                      return v.options?.some(
                                        (opt) => opt.name === key && opt.value === value,
                                      )
                                    })
                                  })

                                  setSelectedVariant(matchingVariant || null)
                                  // Reset to first image when variant changes (images will update via getImages)
                                  setSelected(0)

                                  // Update URL with variant ID to persist selection
                                  if (matchingVariant) {
                                    const url = new URL(window.location.href)
                                    url.searchParams.set('variant', matchingVariant.id)
                                    router.replace(url.pathname + url.search, { scroll: false })
                                  }
                                }}
                                disabled={!isAvailable}
                                className={`
                                  ${imageUrl ? 'p-0 overflow-hidden' : 'btn btn-sm'}
                                  transition-all relative
                                  ${
                                    isSelected
                                      ? imageUrl
                                        ? 'ring-2 ring-primary ring-offset-2'
                                        : 'btn-primary'
                                      : isAvailable
                                        ? imageUrl
                                          ? 'ring-1 ring-base-300 hover:ring-2 hover:ring-primary/50'
                                          : 'btn-outline'
                                        : 'opacity-30 cursor-not-allowed'
                                  }
                                  ${imageUrl ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-lg' : ''}
                                `}
                                title={val.value}
                              >
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={val.value}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                ) : (
                                  <span>{val.value}</span>
                                )}
                              </button>
                            )
                          }
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Stock warnings */}
            {isLowStock && (
              <div className="text-sm text-warning flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Only {stockSource.quantity} left in stock
              </div>
            )}
            {isOutOfStock && (
              <div className="text-sm text-error flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Out of stock
              </div>
            )}
            {stockSource.trackQuantity &&
              stockSource.quantity === 0 &&
              stockSource.allowBackorders && (
                <div className="text-sm text-info flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Currently out of stock - available for back order
                </div>
              )}
            {stockSource.trackQuantity &&
              stockSource.allowBackorders &&
              stockSource.quantity &&
              stockSource.quantity > 0 &&
              stockSource.quantity <= 5 && (
                <div className="text-sm text-info flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Only {stockSource.quantity} in stock - back orders available
                </div>
              )}

            {/* Price - Mobile only (shown right above quantity controls) */}
            <div className="flex lg:hidden items-baseline gap-3">
              {(() => {
                if (selectedVariant?.price) {
                  // Variant has custom price
                  return selectedVariant.compareAtPrice ? (
                    <>
                      <div className="text-xl font-bold">
                        {formatPrice(selectedVariant.price, product.currency)}
                      </div>
                      <div className="text-sm line-through text-base-content/50">
                        {formatPrice(selectedVariant.compareAtPrice, product.currency)}
                      </div>
                      <div className="text-xs text-success font-medium">
                        Save{' '}
                        {formatPrice(
                          Number(selectedVariant.compareAtPrice) - Number(selectedVariant.price),
                          product.currency,
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-xl font-bold">
                      {formatPrice(selectedVariant.price, product.currency)}
                    </div>
                  )
                } else if (product.salePrice) {
                  // Product sale price
                  return (
                    <>
                      <div className="text-xl font-bold">
                        {formatPrice(product.salePrice, product.currency)}
                      </div>
                      <div className="text-sm line-through text-base-content/50">
                        {formatPrice(product.price, product.currency)}
                      </div>
                      <div className="text-xs text-success font-medium">
                        Save{' '}
                        {formatPrice(
                          Number(product.price) - Number(product.salePrice),
                          product.currency,
                        )}
                      </div>
                    </>
                  )
                } else {
                  // Regular product price
                  return (
                    <div className="text-xl font-bold">
                      {formatPrice(product.price, product.currency)}
                    </div>
                  )
                }
              })()}
            </div>

            {/* Quantity selector and action buttons */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <div className="join border border-base-300 rounded-lg">
                  <button
                    onClick={decrease}
                    className="btn btn-sm join-item border-none"
                    disabled={qty <= 1 || isOutOfStock || cartLoading}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <div className="join-item flex items-center justify-center min-w-[40px] sm:min-w-[50px] px-2 sm:px-3 font-semibold text-sm sm:text-base">
                    {qty}
                  </div>
                  <button
                    onClick={increase}
                    className="btn btn-sm join-item border-none"
                    disabled={qty >= maxQuantity || isOutOfStock || cartLoading}
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  className={`btn btn-sm sm:btn-md ${
                    justAdded ? 'btn-success' : 'btn-primary'
                  } px-4 sm:px-6 transition-all duration-300 flex-1 sm:flex-initial`}
                  disabled={cartLoading || justAdded || isOutOfStock}
                  aria-label={justAdded ? 'Added to cart' : 'Add to cart'}
                >
                  {cartLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : justAdded ? (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">Added!</span>
                    </>
                  ) : isOutOfStock ? (
                    <span className="text-sm sm:text-base">Out of Stock</span>
                  ) : (
                    <span className="text-sm sm:text-base">Add to cart</span>
                  )}
                </button>
              </div>

              {/* Checkout button - only show if item is in cart */}
              {quantityInCart > 0 && (
                <button
                  onClick={() => router.push('/checkout')}
                  className="btn btn-sm sm:btn-md btn-accent w-full transition-all duration-300"
                >
                  <span className="text-sm sm:text-base">Go to Checkout</span>
                </button>
              )}
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
            <div className="bg-base-200/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 text-xs sm:text-sm border border-base-300">
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
            </div>
          </div>
        </aside>
      </div>

      {/* Product Description & Specifications - Full Width */}
      <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
        {/* Product Description */}
        {descriptionHtml && (
          <div>
            <div className="prose prose-sm sm:prose-lg max-w-none">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Description</h3>
              <div
                className="text-sm sm:text-base text-base-content/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          </div>
        )}
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
