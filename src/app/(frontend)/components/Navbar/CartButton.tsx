'use client'

import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart, getCartItemCount } from '@/providers'
import MiniCart from '../MiniCart'

export default function CartButton() {
  const { cart } = useCart()
  const count = getCartItemCount(cart)

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm relative" title="Cart">
        <ShoppingCart className="w-5 h-5" />

        {count > 0 && (
          <span
            aria-live="polite"
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-medium"
          >
            {count}
          </span>
        )}
      </div>

      <div
        tabIndex={0}
        className="dropdown-content z-50 mt-3 card card-compact bg-base-100 shadow-xl"
      >
        <MiniCart />
      </div>
    </div>
  )
}
