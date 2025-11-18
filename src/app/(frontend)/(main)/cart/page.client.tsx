'use client'

import React from 'react'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Truck,
  Lock,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
  useCart,
  calculateSubtotal,
  getCartItemCount,
  formatCurrency,
  isCartEmpty,
} from '@/providers'

export default function CartPageClient() {
  const { cart, loading, error, updateQuantity, removeItem, clearCart } = useCart()

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart()
      } catch (err) {
        console.error('Failed to clear cart:', err)
      }
    }
  }

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
    variantId?: string,
  ) => {
    try {
      await updateQuantity(productId, newQuantity, variantId)
    } catch (err) {
      console.error('Failed to update quantity:', err)
    }
  }

  const handleRemoveItem = async (productId: string, variantId?: string) => {
    try {
      await removeItem(productId, variantId)
    } catch (err) {
      console.error('Failed to remove item:', err)
    }
  }

  // Calculate totals
  const items = cart?.items || []
  const subtotal = calculateSubtotal(items)
  const shipping = subtotal >= 1000 ? 0 : 50
  const total = subtotal + shipping

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-base-100 min-h-screen flex items-center justify-center">
        <div className="card bg-base-200 max-w-md">
          <div className="card-body text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-error mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Cart</h2>
            <p className="text-base-content/70 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart state
  if (isCartEmpty(cart)) {
    return (
      <div className="bg-base-100 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="card bg-base-200 max-w-2xl mx-auto">
            <div className="card-body text-center py-12 sm:py-16">
              <ShoppingBag className="w-20 h-20 sm:w-24 sm:h-24 mx-auto opacity-30 mb-4 sm:mb-6" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Your Cart is Empty</h2>
              <p className="text-base-content/70 mb-6 sm:mb-8 text-sm sm:text-base">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link href="/shop" className="btn btn-primary btn-md sm:btn-lg">
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Shopping Cart</h1>
          <p className="text-base-content/70 text-sm sm:text-base">
            {getCartItemCount(cart)} {getCartItemCount(cart) === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            <div className="flex justify-end mb-2">
              <button
                onClick={handleClearCart}
                className="btn btn-ghost btn-xs sm:btn-sm text-error"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clear Cart</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>

            {items.map((item) => {
              if (!item.product) return null

              const imageUrl =
                typeof item.product.images?.[0] === 'string'
                  ? item.product.images[0]
                  : item.product.images?.[0]?.url || '/placeholder.jpg'

              return (
                <div
                  key={item.productId}
                  className="card bg-base-200 transition-all duration-200 hover:shadow-md"
                >
                  <div className="card-body p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4 flex-col sm:flex-row">
                      <Link href={`/shop/${item.product.slug}`} className="flex-shrink-0">
                        <div className="w-full sm:w-20 md:w-24 h-40 sm:h-20 md:h-24 bg-base-100 rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/shop/${item.product.slug}`}
                          className="font-semibold text-base sm:text-lg hover:text-primary transition-colors line-clamp-2 block mb-1"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-xl sm:text-2xl font-bold text-primary mt-1 sm:mt-2">
                          {formatCurrency(
                            item.product.salePrice || item.product.price,
                            item.product.currency,
                          )}
                          {item.product.salePrice && (
                            <span className="text-xs sm:text-sm line-through opacity-60 ml-2">
                              {formatCurrency(item.product.price, item.product.currency)}
                            </span>
                          )}
                        </div>
                        {item.product.trackQuantity &&
                          !item.product.allowBackorders &&
                          item.product.quantity <= 5 &&
                          item.product.quantity > 0 && (
                            <div className="text-sm text-warning mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Only {item.product.quantity} left in stock
                            </div>
                          )}
                        {item.product.trackQuantity &&
                          item.product.allowBackorders &&
                          item.product.quantity <= 5 &&
                          item.product.quantity > 0 && (
                            <div className="text-sm text-info mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Only {item.product.quantity} in stock - back orders available
                            </div>
                          )}
                        {item.product.trackQuantity &&
                          item.product.quantity === 0 &&
                          item.product.allowBackorders && (
                            <div className="text-sm text-info mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Out of stock - back order
                            </div>
                          )}
                        {item.isInStock === false && !item.product.allowBackorders && (
                          <div className="text-sm text-error mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Out of stock
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-4">
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.variantId)}
                          className="btn btn-ghost btn-xs sm:btn-sm btn-square text-error hover:bg-error hover:text-error-content transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>

                        <div className="join border border-base-300 rounded-lg">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity - 1,
                                item.variantId,
                              )
                            }
                            className="btn btn-xs sm:btn-sm join-item border-none"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <div className="join-item flex items-center justify-center min-w-[40px] sm:min-w-[50px] px-2 sm:px-3 font-semibold text-sm sm:text-base">
                            {item.quantity}
                          </div>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(
                                item.productId,
                                item.quantity + 1,
                                item.variantId,
                              )
                            }
                            className="btn btn-xs sm:btn-sm join-item border-none"
                            disabled={
                              item.quantity >= 99 ||
                              !!(
                                item.product.trackQuantity &&
                                !item.product.allowBackorders &&
                                item.quantity >= item.product.quantity
                              )
                            }
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs sm:text-sm opacity-70">Subtotal</div>
                          <div className="text-lg sm:text-xl font-bold">
                            {formatCurrency(
                              (item.product.salePrice || item.product.price) * item.quantity,
                              item.product.currency,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <Link href="/shop" className="btn btn-outline w-full lg:w-auto">
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-3 sm:space-y-4">
              {/* Order Summary */}
              <div className="card bg-base-200 shadow-md">
                <div className="card-body p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Order Summary</h3>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="opacity-70">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal, 'AFN')}</span>
                    </div>

                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="opacity-70">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-success font-semibold">FREE</span>
                        ) : (
                          formatCurrency(shipping, 'AFN')
                        )}
                      </span>
                    </div>

                    {subtotal < 1000 && subtotal > 0 && (
                      <div className="text-xs opacity-70 bg-info/10 p-2 rounded animate-pulse">
                        Add {formatCurrency(1000 - subtotal, 'AFN')} more for free shipping!
                      </div>
                    )}

                    <div className="divider my-1 sm:my-2"></div>

                    <div className="flex justify-between text-lg sm:text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(total, 'AFN')}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="btn btn-primary btn-md sm:btn-lg w-full mt-4 sm:mt-6 hover:scale-[1.02] transition-transform"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Link>

                  <div className="space-y-2 mt-4 sm:mt-6 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 opacity-70">
                      <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Free shipping on orders of {formatCurrency(1000, 'AFN')} or more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
