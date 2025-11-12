'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag, X, ArrowRight } from 'lucide-react'
import { useCart, formatCurrency, calculateSubtotal, type CartItem } from '@/providers'

export default function MiniCart() {
  const { cart, loading, error, removeItem } = useCart()
  const items = cart?.items || []
  const subtotal = calculateSubtotal(items)

  if (loading) {
    return (
      <div className="w-80 p-4 text-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-80 p-4">
        <p className="text-error text-sm">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="w-80 p-6 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto opacity-30 mb-3" />
        <p className="text-base-content/70 mb-4">Your cart is empty</p>
        <Link href="/shop" className="btn btn-primary btn-sm">
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="w-80">
      {/* Cart Items */}
      <div className="max-h-96 overflow-y-auto">
        {items.map((item) => {
          if (!item.product) return null

          const imageUrl =
            typeof item.product.images?.[0] === 'string'
              ? item.product.images[0]
              : item.product.images?.[0]?.url || '/placeholder.jpg'

          const price = item.product.salePrice || item.product.price || 0

          return (
            <div key={item.productId} className="flex gap-3 p-3 border-b border-base-300">
              <Link href={`/shop/${item.product.slug}`} className="flex-shrink-0">
                <div className="w-16 h-16 bg-base-200 rounded overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/shop/${item.product.slug}`}
                  className="text-sm font-medium hover:text-primary line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <div className="text-xs opacity-70 mt-1">Qty: {item.quantity}</div>
                <div className="text-sm font-semibold text-primary mt-1">
                  {formatCurrency(price * item.quantity, item.product.currency)}
                </div>
              </div>

              <button
                onClick={async (e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  try {
                    await removeItem(item.productId, item.variantId)
                  } catch (err) {
                    console.error('Failed to remove item:', err)
                  }
                }}
                className="btn btn-ghost btn-xs btn-square"
                aria-label="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Cart Summary */}
      <div className="p-4 bg-base-200 border-t border-base-300">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold">Subtotal:</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(subtotal, 'AFN')}</span>
        </div>

        <Link href="/cart" className="btn btn-primary btn-block btn-sm mb-2">
          View Cart
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link href="/checkout" className="btn btn-outline btn-block btn-sm">
          Checkout
        </Link>
      </div>
    </div>
  )
}
