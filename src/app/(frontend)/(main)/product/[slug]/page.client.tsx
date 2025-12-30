'use client'

import React, { useState, useEffect } from 'react'
import { Product, Media, ProductVariant, Category } from '@/payload-types'
import {
  Star,
  Plus,
  Minus,
  AlertCircle,
  Check,
  X,
  PackageX,
  AlertTriangle,
  Clock,
  CreditCard,
} from 'lucide-react'
import { useCart } from '@/providers/cart'
import { useRecentlyViewed } from '@/providers/recentlyViewed'
import { ReviewsSection } from '@/app/(frontend)/components/ReviewsSection'
import { HybridProductGallery } from '@/app/(frontend)/components/HybridProductGallery'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatPrice } from '@/utilities/currency'
import Image from 'next/image'
import { Breadcrumb, type BreadcrumbItem } from '@/app/(frontend)/components/Breadcrumb'
import { getStockStatusLabel, getStockStatusTextClass, PLACEHOLDER_IMAGE } from '@/utilities/ui'

type Props = {
  product: Product
  descriptionHtml: string
  isAuthenticated: boolean
  initialVariants: ProductVariant[]
  variantDescriptions?: Record<string, string> // Pre-serialized variant descriptions
  storeSlug?: string // Optional: if provided, use store-specific URLs
  storeName?: string // Optional: store name for breadcrumbs
}

interface ErrorWithMessage {
  message?: string
}

export default function ProductDetailsClient({
  product,
  descriptionHtml,
  isAuthenticated,
  initialVariants,
  variantDescriptions = {},
  storeSlug,
  storeName,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem, cart } = useCart()
  const { trackView } = useRecentlyViewed()

  // State declarations - must be at the top before any usage
  const [_selected, setSelected] = useState(0)
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Variant state - initialize with server-fetched variants
  const [variants] = useState<ProductVariant[]>(initialVariants)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  // Track product view on mount
  useEffect(() => {
    trackView(product.id)
  }, [product.id, trackView])

  // Set selected variant from URL or default
  useEffect(() => {
    if (!product.hasVariants || variants.length === 0) {
      return
    }

    // Check URL for variant ID, otherwise use default variant
    const urlVariantId = searchParams.get('variant')
    let variantToSelect: ProductVariant | null = null

    if (urlVariantId) {
      // Try to find variant from URL
      variantToSelect = variants.find((v: ProductVariant) => v.id === urlVariantId) || null
    }

    // If no variant from URL or not found, use default or first variant
    if (!variantToSelect) {
      variantToSelect = variants.find((v: ProductVariant) => v.isDefault) || variants[0] || null
    }

    if (variantToSelect) {
      setSelectedVariant(variantToSelect)
      // Build selected options from variant
      const options: Record<string, string> = {}
      variantToSelect.options?.forEach((opt: { name: string; value: string }) => {
        options[opt.name] = opt.value
      })
      setSelectedOptions(options)

      // Update URL with variant ID if not already set
      if (!urlVariantId || urlVariantId !== variantToSelect.id) {
        const url = new URL(window.location.href)
        url.searchParams.set('variant', variantToSelect.id)
        router.replace(url.pathname + url.search, { scroll: false })
      }

      // Reset to first image when variant is set
      setSelected(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.hasVariants, variants.length, searchParams])

  // Check if product is already in cart
  // For products with variants, match both product ID and variant ID
  // For products without variants, match only product ID
  const getQuantityInCart = () => {
    if (!cart?.items) return 0

    if (product.hasVariants && selectedVariant) {
      // Match specific variant
      const variantCartItem = cart.items.find(
        (item) => item.productId === product.id && item.variantId === selectedVariant.id,
      )
      return variantCartItem?.quantity || 0
    } else {
      // Match product only (no variant)
      const productCartItem = cart.items.find((item) => item.productId === product.id)
      return productCartItem?.quantity || 0
    }
  }

  const quantityInCart = getQuantityInCart()

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

  // HIERARCHICAL STOCK STATUS LOGIC (Frontend Display)
  // ===================================================
  // Product-level status (discontinued/out_of_stock) takes precedence over variant status
  // This ensures UI consistency with backend validation and prevents customer confusion
  //
  // Logic Flow:
  // 1. If product.stockStatus === 'discontinued' → Show as discontinued (all variants)
  // 2. If product.stockStatus === 'out_of_stock' → Show as out of stock (all variants)
  // 3. If product has variants and ALL variants are unavailable → Show as out of stock
  // 4. Otherwise → Show variant status (if selected) or product status
  //
  // Example:
  // - Product: discontinued | Variant A: in_stock → Display: "discontinued" ❌
  // - Product: in_stock | Variant A: discontinued → Display: "discontinued" ✓
  // - Product: in_stock | Variant A: in_stock → Display: "in_stock" ✓
  // - Product: in_stock | All variants: out_of_stock → Display: "out_of_stock" ✓

  // Check if all variants are unavailable
  const allVariantsUnavailable =
    product.hasVariants &&
    variants.length > 0 &&
    variants.every((v) => v.stockStatus === 'out_of_stock' || v.stockStatus === 'discontinued')

  const stockSource = selectedVariant || product
  const stockStatus =
    product.stockStatus === 'discontinued'
      ? 'discontinued'
      : product.stockStatus === 'out_of_stock'
        ? 'out_of_stock'
        : allVariantsUnavailable
          ? 'out_of_stock'
          : (stockSource.stockStatus ?? 'in_stock')

  // Check if product is out of stock or discontinued
  const isOutOfStock = stockStatus === 'out_of_stock' || stockStatus === 'discontinued'
  const isLowStock = stockStatus === 'low_stock'
  const isBackorder = stockStatus === 'on_backorder'

  // Check if stock status should be shown to customers
  // Note: Even when hidden, stock validation still happens on add-to-cart
  const showStockToCustomer = product.showStockInFrontend !== false
  const maxQuantity =
    stockSource.trackQuantity && stockSource.quantity && !stockSource.allowBackorders
      ? Math.min(9999, Math.max(0, stockSource.quantity - quantityInCart))
      : 9999

  const increase = () => setQty((q) => Math.min(maxQuantity, q + 1))
  const decrease = () => setQty((q) => Math.max(1, q - 1))

  // Helper function for error handling
  const handleError = (e: unknown, context: string) => {
    console.error(`Error in ${context}:`, e)

    let errorMessage = `خطا در ${context}. لطفا دوباره تلاش کنید.`

    const error = e as ErrorWithMessage
    if (error?.message) {
      if (error.message.includes('stock') || error.message.includes('available')) {
        errorMessage = error.message
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'خطای شبکه. لطفا اتصال خود را بررسی کنید.'
      } else if (error.message.includes('auth') || error.message.includes('login')) {
        errorMessage = 'لطفا برای ادامه وارد شوید.'
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
    if (justAdded || isAddingToCart) return

    // Check if variant is required but not selected
    if (product.hasVariants && !selectedVariant) {
      toast.error('لطفا تمام گزینه‌های محصول را انتخاب کنید')
      return
    }

    // Check if product is out of stock or discontinued
    if (isOutOfStock) {
      const message =
        stockStatus === 'discontinued'
          ? 'این محصول دیگر تولید نمی‌شود و قابل خرید نیست'
          : 'این محصول موجود نیست'
      toast.error(message)
      return
    }

    setError(null)
    setIsAddingToCart(true)

    try {
      await addItem(product.id, qty, selectedVariant?.id)

      // Success feedback
      setJustAdded(true)
      playSuccessSound()
      toast.success(`${qty} عدد به سبد خرید اضافه شد!`)

      // Reset quantity to 1 after successful add
      setQty(1)

      // Reset after 2 seconds
      setTimeout(() => setJustAdded(false), 2000)
    } catch (e: unknown) {
      handleError(e, 'افزودن به سبد خرید')
      // Reset quantity to available amount if stock error
      const error = e as ErrorWithMessage
      if (error?.message?.includes('available in stock')) {
        setQty(1)
      }
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = []

  // Add category if available
  if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
    const category = product.categories[0]
    if (typeof category === 'object' && 'name' in category && 'slug' in category) {
      // Use store-specific category URL if in store context
      const categoryHref = storeSlug
        ? `/store/${storeSlug}/category/${(category as Category).slug}`
        : `/category/${(category as Category).slug}`
      breadcrumbItems.push({
        label: (category as Category).name,
        href: categoryHref,
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
        <Breadcrumb items={breadcrumbItems} storeSlug={storeSlug} storeName={storeName} />
      </div>

      {/* Product Name - Above everything (mobile only) */}
      <div className="mb-3 lg:hidden">
        <h1 className="text-xl font-normal">{product.name}</h1>
        {/* Discontinued/Out of Stock Badge - Mobile */}
        {showStockToCustomer && stockStatus === 'discontinued' && (
          <div className="mt-2 inline-flex items-center gap-2 bg-error text-error-content px-3 py-1.5 rounded-lg text-xs font-bold">
            <X className="w-4 h-4" />
            <span>توقف تولید</span>
          </div>
        )}
        {showStockToCustomer && stockStatus === 'out_of_stock' && (
          <div className="mt-2 inline-flex items-center gap-2 bg-warning text-warning-content px-3 py-1.5 rounded-lg text-xs font-bold">
            <PackageX className="w-4 h-4" />
            <span>ناموجود</span>
          </div>
        )}
      </div>

      {/* Rating summary - Mobile only, right below title */}
      <div className="flex items-center gap-2 mb-4 lg:hidden" dir="rtl">
        <div className="flex items-center gap-1 text-rating">
          <Star size={16} fill="currentColor" />
          <span className="font-semibold text-base-content text-sm">
            {product.averageRating ? product.averageRating.toFixed(1) : 'بدون امتیاز'}
          </span>
        </div>
        {product.reviewCount && product.reviewCount > 0 && (
          <>
            <span className="text-base-content/40 text-sm">•</span>
            <a
              href="#reviews"
              className="text-xs text-base-content/70 hover:text-primary transition-colors"
            >
              {product.reviewCount} {product.reviewCount === 1 ? 'نظریه' : 'نظریه'}
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
              {/* Discontinued/Out of Stock Badge - Desktop */}
              {showStockToCustomer && stockStatus === 'discontinued' && (
                <div className="hidden lg:inline-flex items-center gap-2 bg-error text-error-content px-3 py-1.5 rounded-lg text-xs font-bold mb-3">
                  <X className="w-4 h-4" />
                  <span>توقف تولید</span>
                </div>
              )}
              {showStockToCustomer && stockStatus === 'out_of_stock' && (
                <div className="hidden lg:inline-flex items-center gap-2 bg-warning text-warning-content px-3 py-1.5 rounded-lg text-xs font-bold mb-3">
                  <PackageX className="w-4 h-4" />
                  <span>ناموجود</span>
                </div>
              )}
              {/* Rating summary - Desktop only */}
              <div className="hidden lg:flex items-center gap-2 sm:gap-3" dir="rtl">
                <div className="flex items-center gap-1 text-rating">
                  <Star size={18} fill="currentColor" />
                  <span className="font-semibold text-base-content">
                    {product.averageRating ? product.averageRating.toFixed(1) : 'بدون امتیاز'}
                  </span>
                </div>
                {product.reviewCount && product.reviewCount > 0 && (
                  <>
                    <span className="text-base-content/40">•</span>
                    <a
                      href="#reviews"
                      className="text-sm text-base-content/70 hover:text-primary transition-colors"
                    >
                      {product.reviewCount} {product.reviewCount === 1 ? 'نظریه' : 'نظریه'}
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
                        صرفه‌جویی{' '}
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
                        صرفه‌جویی{' '}
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
                {product.variantOptions?.map((option) => {
                  // Filter option values to only show those that exist in actual variants
                  const existingValues = option.values?.filter((val) => {
                    return variants.some((v) => {
                      return v.options?.some(
                        (opt) => opt.name === option.name && opt.value === val.value,
                      )
                    })
                  })

                  // Don't render this option section if no values exist in variants
                  if (!existingValues || existingValues.length === 0) {
                    return null
                  }

                  return (
                    <div key={option.name} className="space-y-2">
                      <label className="text-sm font-medium text-base-content">
                        {option.name}:
                        {selectedOptions[option.name] && (
                          <span className="mr-2 text-primary">{selectedOptions[option.name]}</span>
                        )}
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {existingValues.map((val) => {
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

                              // Check if variant is discontinued or out of stock
                              if (
                                v.stockStatus === 'discontinued' ||
                                v.stockStatus === 'out_of_stock'
                              ) {
                                return false
                              }

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

                          // Get image URL if exists
                          const imageUrl =
                            val.image && typeof val.image === 'object' && 'url' in val.image
                              ? val.image.url
                              : null

                          return (
                            <button
                              key={val.value}
                              onClick={() => {
                                // Don't allow clicking unavailable options
                                if (!isAvailable) return

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
                                      : imageUrl
                                        ? 'ring-1 ring-base-300 opacity-40 cursor-not-allowed'
                                        : 'btn-outline btn-disabled opacity-40'
                                }
                                ${imageUrl ? 'w-16 h-16 sm:w-20 sm:h-20 rounded-lg' : ''}
                              `}
                              title={isAvailable ? val.value : `${val.value} (ناموجود)`}
                            >
                              {imageUrl ? (
                                <>
                                  <Image
                                    src={imageUrl}
                                    alt={val.value}
                                    fill
                                    className={`object-cover ${!isAvailable ? 'grayscale' : ''}`}
                                    sizes="80px"
                                  />
                                  {!isAvailable && (
                                    <div className="absolute inset-0 bg-base-100/60 flex items-center justify-center">
                                      <X className="w-6 h-6 text-error" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className={!isAvailable ? 'line-through' : ''}>
                                  {val.value}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Stock status display - only shown when showStockInFrontend is enabled */}
            {showStockToCustomer && (
              <div className="text-sm font-bold tracking-wider" dir="rtl">
                {stockStatus === 'discontinued' ? (
                  <div className="space-y-2">
                    <span
                      className={`${getStockStatusTextClass('discontinued')} flex items-center gap-2`}
                    >
                      <X className="w-5 h-5" />
                      {getStockStatusLabel('discontinued')}
                    </span>
                    <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-xs font-normal text-error">
                      <p>این محصول دیگر تولید نمی‌شود و قابل خرید نیست</p>
                    </div>
                  </div>
                ) : isOutOfStock ? (
                  <div className="space-y-2">
                    <span
                      className={`${getStockStatusTextClass('out_of_stock')} flex items-center gap-2`}
                    >
                      <PackageX className="w-5 h-5" />
                      {getStockStatusLabel('out_of_stock')}
                    </span>
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs font-normal text-warning">
                      <p>این محصول در حال حاضر موجود نیست</p>
                    </div>
                  </div>
                ) : isLowStock ? (
                  <span
                    className={`${getStockStatusTextClass('low_stock')} flex items-center gap-2`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    {stockSource.trackQuantity && stockSource.quantity
                      ? `تنها ${stockSource.quantity} عدد`
                      : getStockStatusLabel('low_stock')}
                  </span>
                ) : isBackorder ? (
                  <span
                    className={`${getStockStatusTextClass('on_backorder')} flex items-center gap-2`}
                  >
                    <Clock className="w-5 h-5" />
                    {getStockStatusLabel('on_backorder')}
                  </span>
                ) : stockStatus === 'in_stock' ? (
                  <span
                    className={`${getStockStatusTextClass('in_stock')} flex items-center gap-2 opacity-60`}
                  >
                    <Check className="w-5 h-5" />
                    {getStockStatusLabel('in_stock')}
                  </span>
                ) : null}
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
                        صرفه‌جویی{' '}
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
                        صرفه‌جویی{' '}
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
                    disabled={qty <= 1 || isOutOfStock || isAddingToCart}
                    aria-label="کاهش تعداد"
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={qty}
                    onChange={(e) => {
                      if (isOutOfStock || isAddingToCart) return
                      const value = parseInt(e.target.value) || 1
                      const clampedValue = Math.min(Math.max(1, value), maxQuantity)
                      setQty(clampedValue)
                    }}
                    disabled={isOutOfStock || isAddingToCart}
                    className="join-item w-16 sm:w-20 text-center font-semibold text-sm sm:text-base bg-transparent border-none focus:outline-none focus:ring-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    aria-label="تعداد"
                  />
                  <button
                    onClick={increase}
                    className="btn btn-sm join-item border-none"
                    disabled={qty >= maxQuantity || isOutOfStock || isAddingToCart}
                    aria-label="افزایش تعداد"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <button
                  onClick={addToCart}
                  className={`btn btn-sm sm:btn-md ${
                    justAdded
                      ? 'btn-success'
                      : isOutOfStock || maxQuantity === 0
                        ? 'btn-disabled'
                        : 'btn-primary'
                  } px-4 sm:px-6 transition-all duration-300 flex-1 sm:flex-initial`}
                  disabled={isAddingToCart || justAdded || isOutOfStock || maxQuantity === 0}
                  aria-label={
                    isOutOfStock
                      ? stockStatus === 'discontinued'
                        ? 'توقف تولید'
                        : 'ناموجود'
                      : maxQuantity === 0
                        ? 'همه موجودی در سبد است'
                        : justAdded
                          ? 'اضافه شد به سبد'
                          : 'افزودن به سبد'
                  }
                >
                  {isAddingToCart ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : justAdded ? (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">اضافه شد!</span>
                    </>
                  ) : isOutOfStock ? (
                    <>
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">
                        {stockStatus === 'discontinued' ? 'توقف تولید' : 'ناموجود'}
                      </span>
                    </>
                  ) : maxQuantity === 0 ? (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base">همه موجودی در سبد است</span>
                    </>
                  ) : (
                    <span className="text-sm sm:text-base">افزودن به سبد</span>
                  )}
                </button>
              </div>

              {/* Checkout button - only show if item is in cart */}
              {quantityInCart > 0 && (
                <button
                  onClick={() => router.push('/checkout')}
                  className="btn btn-sm sm:btn-md btn-accent w-full transition-all duration-300"
                >
                  <CreditCard />
                  <span className="text-sm sm:text-base">تصفیه حساب</span>
                </button>
              )}
            </div>

            {/* Error message alert */}
            {error && (
              <div className="alert alert-error shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3 w-full">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold">خطا</h3>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="btn btn-sm btn-ghost btn-circle"
                    aria-label="بستن پیام خطا"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Key Information */}
            {product.allowBackorders && (
              <div className="bg-base-200/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 text-xs sm:text-sm border border-base-300">
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
                    <p className="font-medium text-base-content">پیش‌سفارش فعال است</p>
                    <p className="text-base-content/70">
                      سفارش دهید، بعد از موجود شدن ارسال می‌شود
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Product Description - Shows variant description if available, otherwise product description */}
      <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
        {(() => {
          // Determine which description to show
          // Priority: variant description > product description
          const variantHasDescription = selectedVariant && variantDescriptions[selectedVariant.id]
          const descriptionToShow = variantHasDescription
            ? variantDescriptions[selectedVariant.id]
            : descriptionHtml

          if (!descriptionToShow) return null

          return (
            <div dir="rtl">
              <div className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-right prose-p:text-right prose-li:text-right">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">توضیحات</h3>
                <div
                  className="text-sm sm:text-base text-base-content/80 leading-relaxed [&>*]:text-right"
                  dangerouslySetInnerHTML={{ __html: descriptionToShow }}
                />
              </div>
            </div>
          )
        })()}
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mt-16 scroll-mt-24" dir="rtl">
        <ReviewsSection productId={product.id} isAuthenticated={isAuthenticated} />
      </div>
    </>
  )
}
