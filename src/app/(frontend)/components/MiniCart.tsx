'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag, X, ArrowRight } from 'lucide-react'
import { useCart, formatCurrency, calculateSubtotal, type CartItem } from '@/providers'

interface MiniCartProps {
  onClose?: () => void
}

export default function MiniCart({ onClose }: MiniCartProps) {
  const { cart, loading, error, removeItem } = useCart()
  const items = cart?.items || []
  const subtotal = calculateSubtotal(items)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-error text-sm">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto opacity-30 mb-4" />
        <p className="text-base-content/70 mb-4 text-lg">Your cart is empty</p>
        <Link
          href="/shop"
          className="btn btn-primary"
          onClick={() => {
            if (onClose) onClose()
          }}
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.map((item) => {
          if (!item.product) return null

          const imageUrl =
            typeof item.product.images?.[0] === 'string'
              ? item.product.images[0]
              : item.product.images?.[0]?.url || '/placeholder.jpg'

          const price = item.product.salePrice || item.product.price || 0

          return (
            <div key={item.productId} className="flex gap-3 pb-3 mb-3 border-b border-base-300 last:border-b-0">
              <Link
                href={`/shop/${item.product.slug}`}
                className="flex-shrink-0"
                onClick={() => {
                  if (onClose) onClose()
                }}
              >
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
                  onClick={() => {
                    if (onClose) onClose()
                  }}
                >
                  {item.product.name}
                </Link>
                <div className="text-xs opacity-70 mt-1">Qty: {item.quantity}</div>
                <div className="text-sm font-semibold text-primary mt-1">
                  {formatCurrency(price * item.quantity, item.product.currency)}
                </div>
              </div>

              <button
                type="button"
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

      {/* Cart Summary - Fixed at bottom */}
      <div className="p-4 bg-base-200 border-t border-base-300 mt-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-lg">Subtotal:</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(subtotal, 'AFN')}</span>
        </div>

        <Link
          href="/cart"
          className="btn btn-primary btn-block mb-2"
          onClick={(e) => {
            if (onClose) onClose()
          }}
        >
          View Cart
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/checkout"
          className="btn btn-outline btn-block"
          onClick={(e) => {
            if (onClose) onClose()
          }}
        >
          Checkout
        </Link>
      </div>
    </div>
  )
}
