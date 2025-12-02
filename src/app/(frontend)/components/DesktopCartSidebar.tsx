'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, ShoppingBag, ArrowRight, Plus, Minus, Package, Trash2 } from 'lucide-react'
import { useCart, formatCurrency, calculateSubtotal } from '@/providers'
import Image from 'next/image'

interface DesktopCartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function DesktopCartSidebar({ isOpen, onClose }: DesktopCartSidebarProps) {
  const { cart, loading, error, removeItem, updateQuantity } = useCart()
  const items = cart?.items || []
  const subtotal = calculateSubtotal(items)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [mounted, setMounted] = React.useState(false)

  // Always use AFN for display since calculateSubtotal converts everything to AFN
  // This handles mixed-currency carts correctly
  const cartCurrency: 'USD' | 'AFN' = 'AFN'

  // Free shipping threshold is always 1000 AFN (all prices are converted to AFN)
  const freeShippingThreshold = 1000

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
        className={`fixed right-0 top-0 h-full w-full max-w-full sm:max-w-[450px] bg-base-100 z-[9999] shadow-2xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
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
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">Shopping Cart</h2>
                <p className="text-sm text-base-content/60">
                  {itemCount === 0
                    ? 'Your cart is empty'
                    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-circle" aria-label="Close cart">
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
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-base-content/60 text-center mb-8">
                Looks like you haven&apos;t added anything to your cart yet
              </p>
              <Link href="/shop" className="btn btn-primary" onClick={onClose}>
                <ShoppingBag className="w-5 h-5" />
                Start Shopping
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

                      const imageUrl =
                        typeof item.product.images?.[0] === 'string'
                          ? item.product.images[0]
                          : item.product.images?.[0]?.url || '/placeholder.jpg'

                      const price = item.product.salePrice || item.product.price || 0

                      return (
                        <div
                          key={`${item.productId}-${item.variantId}`}
                          className="flex gap-4 p-4 rounded-xl border border-base-200 hover:border-base-300 hover:shadow-md transition-all duration-200 bg-base-100"
                        >
                          {/* Product Image */}
                          <Link
                            href={`/shop/${item.product.slug}`}
                            className="flex-shrink-0"
                            onClick={onClose}
                          >
                            <div className="w-24 h-24 bg-base-200 rounded-lg overflow-hidden group">
                              <Image
                                src={imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          </Link>

                          {/* Product Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <Link
                                href={`/shop/${item.product.slug}`}
                                className="font-medium hover:text-primary transition-colors line-clamp-2 flex-1 mr-2"
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

                            {/* Price */}
                            <div className="text-lg font-bold text-primary mb-2">
                              {formatCurrency(price * item.quantity, item.product.currency)}
                              {item.quantity > 1 && (
                                <span className="text-sm font-normal text-base-content/60 ml-2">
                                  ({formatCurrency(price, item.product.currency)} each)
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-base-content/60">Quantity:</span>
                              <div className="flex items-center border border-base-300 rounded-lg">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.productId,
                                      item.variantId,
                                      item.quantity - 1,
                                    )
                                  }
                                  className="btn btn-ghost btn-sm btn-square rounded-r-none"
                                  aria-label="Decrease quantity"
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
                                  className="btn btn-ghost btn-sm btn-square rounded-l-none"
                                  aria-label="Increase quantity"
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

              {/* Cart Footer */}
              <div className="border-t border-base-200 p-6 bg-base-100">
                {/* Free Shipping Progress */}
                {subtotal < freeShippingThreshold && (
                  <div className="mb-4 p-3 bg-info/10 rounded-xl">
                    <p className="text-sm mb-2">
                      Add{' '}
                      <span className="font-bold text-info">
                        {formatCurrency(freeShippingThreshold - subtotal, cartCurrency)}
                      </span>{' '}
                      more for free shipping!
                    </p>
                    <div className="w-full bg-base-300 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-info h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between items-center mb-4 p-4 bg-base-200 rounded-xl">
                  <span className="text-lg font-semibold">Subtotal:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(subtotal, cartCurrency)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    className="btn btn-primary btn-block btn-lg shadow-lg"
                    onClick={onClose}
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <button onClick={onClose} className="btn btn-ghost btn-block">
                    Continue Shopping
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
