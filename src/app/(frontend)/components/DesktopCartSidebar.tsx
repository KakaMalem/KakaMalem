'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, ShoppingBag, Plus, Minus, Package, Trash2, ArrowLeft } from 'lucide-react'
import {
  useCart,
  formatCurrency,
  calculateSubtotal,
  useSiteSettings,
  getRemainingForFreeShipping,
} from '@/providers'
import Image from 'next/image'

interface DesktopCartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function DesktopCartSidebar({ isOpen, onClose }: DesktopCartSidebarProps) {
  const { cart, loading, error, removeItem, updateQuantity } = useCart()
  const { freeDelivery } = useSiteSettings()
  const items = cart?.items || []
  const subtotal = calculateSubtotal(items)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [mounted, setMounted] = React.useState(false)

  // Always use AFN for display since calculateSubtotal converts everything to AFN
  const cartCurrency: 'USD' | 'AFN' = 'AFN'

  // Get remaining amount for free shipping (null if disabled or already qualified)
  const remainingForFree = getRemainingForFreeShipping(subtotal, freeDelivery)

  // Handle mounting
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Handle escape key and browser back button
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    const handlePopState = () => {
      if (isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      window.addEventListener('popstate', handlePopState)
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = 'hidden'

      // Push a new state to history so back button can close the cart
      window.history.pushState({ cartOpen: true }, '')
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('popstate', handlePopState)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleQuantityChange = async (
    productId: string,
    variantId: string | undefined,
    newQuantity: number,
  ) => {
    if (newQuantity <= 0) {
      await removeItem(productId, variantId)
    } else {
      await updateQuantity(productId, newQuantity, variantId)
    }
  }

  if (!mounted) return null

  const cartContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-label="Close cart"
        style={{ isolation: 'isolate' }}
      />

      {/* Sidebar - Full width on mobile, 450px on larger screens */}
      <div
        className={`fixed left-0 top-0 h-full w-full max-w-full sm:max-w-[450px] bg-base-100 z-[9999] shadow-2xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ isolation: 'isolate' }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-base-200 bg-base-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6 text-primary" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -left-2 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">سبد خرید</h2>
                <p className="text-sm text-base-content/60">
                  {itemCount === 0 ? 'سبد خرید شما خالی است' : `${itemCount} مورد`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle"
              aria-label="بستن سبد خرید"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Content */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : error ? (
            <div className="flex-1 p-6">
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-base-200 flex items-center justify-center mb-6">
                <Package className="w-12 h-12 text-base-content/30" />
              </div>
              <h3 className="text-xl font-semibold mb-2">سبد خرید شما خالی است</h3>
              <p className="text-base-content/60 text-center mb-8">
                به نظر می‌رسد هنوز چیزی به سبد خرید خود اضافه نکرده‌اید
              </p>
              <Link href="/" className="btn btn-primary" onClick={onClose}>
                <ShoppingBag className="w-5 h-5" />
                شروع خرید
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {[...items]
                    .sort((a, b) => {
                      const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0
                      const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0
                      return dateB - dateA
                    })
                    .map((item) => {
                      if (!item.product) return null

                      // Get the appropriate image - variant image first, then product image
                      const getImageUrl = (): string => {
                        const placeholder =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

                        // Try variant images first
                        if (
                          item.variant?.images &&
                          Array.isArray(item.variant.images) &&
                          item.variant.images.length > 0
                        ) {
                          const firstImage = item.variant.images[0]
                          if (typeof firstImage === 'string') return firstImage
                          if (typeof firstImage === 'object' && firstImage?.url) {
                            return firstImage.url
                          }
                        }

                        // Fall back to product images
                        if (
                          item.product &&
                          item.product.images &&
                          Array.isArray(item.product.images) &&
                          item.product.images.length > 0
                        ) {
                          const firstImage = item.product.images[0]
                          if (typeof firstImage === 'string') return firstImage
                          if (typeof firstImage === 'object' && firstImage?.url) {
                            return firstImage.url
                          }
                        }

                        return placeholder
                      }

                      const imageUrl = getImageUrl()

                      // Use variant price if available, otherwise product price
                      const price =
                        item.variant?.price ?? item.product.salePrice ?? item.product.price ?? 0

                      // Build product URL with variant query param if variant exists
                      const productUrl = item.variantId
                        ? `/product/${item.product.slug}?variant=${item.variantId}`
                        : `/product/${item.product.slug}`

                      // Calculate maximum quantity based on stock
                      const stockSource = item.variant || item.product
                      const maxQuantity =
                        stockSource.trackQuantity &&
                        stockSource.quantity &&
                        !stockSource.allowBackorders
                          ? Math.min(99, stockSource.quantity)
                          : 99

                      // Check if at max quantity
                      const isAtMaxQuantity = item.quantity >= maxQuantity

                      return (
                        <div
                          key={`${item.productId}-${item.variantId}`}
                          className="flex gap-4 p-4 rounded-xl border border-base-200 hover:border-base-300 hover:shadow-md transition-all duration-200 bg-base-100"
                        >
                          {/* Product Image */}
                          <Link href={productUrl} className="flex-shrink-0" onClick={onClose}>
                            <div className="w-24 h-24 bg-base-200 rounded-lg overflow-hidden group">
                              <Image
                                src={imageUrl}
                                alt={item.product.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <Link
                                href={productUrl}
                                className="font-medium hover:text-primary transition-colors line-clamp-2 flex-1 ml-2"
                                onClick={onClose}
                              >
                                {item.product.name}
                              </Link>
                              <button
                                onClick={() => removeItem(item.productId, item.variantId)}
                                className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Variant Details */}
                            {item.variant &&
                              item.variant.options &&
                              item.variant.options.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {item.variant.options.map((opt, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-base-200 px-2 py-1 rounded-md text-base-content/70"
                                    >
                                      {opt.name}: <span className="font-medium">{opt.value}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

                            {/* Price */}
                            <div className="text-lg font-bold text-primary mb-2">
                              {formatCurrency(price * item.quantity, item.product.currency)}
                              {item.quantity > 1 && (
                                <span className="text-sm font-normal text-base-content/60 mr-2">
                                  ({formatCurrency(price, item.product.currency)} دانه)
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-base-content/60">تعداد:</span>
                              <div className="flex items-center border border-base-300 rounded-lg">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.productId,
                                      item.variantId,
                                      item.quantity - 1,
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className="btn btn-ghost btn-sm btn-square rounded-l-none"
                                  aria-label="کاهش تعداد"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 font-medium min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.productId,
                                      item.variantId,
                                      item.quantity + 1,
                                    )
                                  }
                                  disabled={isAtMaxQuantity}
                                  className="btn btn-ghost btn-sm btn-square rounded-r-none"
                                  aria-label="افزایش تعداد"
                                  title={
                                    isAtMaxQuantity
                                      ? stockSource.trackQuantity && stockSource.quantity
                                        ? `حداکثر ${maxQuantity} عدد در گدام موجود است`
                                        : 'حداکثر مقدار مجاز'
                                      : 'افزایش تعداد'
                                  }
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Cart Footer - Sticky at bottom */}
              <div className="border-t-2 border-base-300 p-6 bg-base-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {/* Free Shipping Progress - only show if enabled and not yet qualified */}
                {remainingForFree !== null && (
                  <div className="mb-6 p-4 bg-info/10 rounded-xl border border-info/20">
                    <p className="text-sm font-medium mb-2">
                      برای {freeDelivery.badgeText}{' '}
                      <span className="font-bold text-info">
                        {formatCurrency(remainingForFree, cartCurrency)}
                      </span>{' '}
                      دیگر اضافه کنید!
                    </p>
                    <div className="w-full bg-base-300 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-primary to-info h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((subtotal / freeDelivery.threshold) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between items-center mb-6 p-5 bg-gradient-to-r from-base-200 to-base-300 rounded-xl">
                  <span className="text-lg font-semibold">مجموع:</span>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(subtotal, cartCurrency)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    className="btn btn-primary btn-block h-14 text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-200"
                    onClick={onClose}
                  >
                    <span className="font-semibold">تصفیه حساب</span>
                    <ArrowLeft className="w-5 h-5" />
                  </Link>

                  <button onClick={onClose} className="btn btn-ghost btn-block h-12 text-sm">
                    ادامه خرید
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )

  return createPortal(cartContent, document.body)
}
