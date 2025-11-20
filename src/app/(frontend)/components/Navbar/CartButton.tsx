'use client'

import React, { useState, useEffect } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { useCart, getCartItemCount } from '@/providers'
import MiniCart from '../MiniCart'

export default function CartButton() {
  const { cart } = useCart()
  const count = getCartItemCount(cart)
  const [isOpen, setIsOpen] = useState(false)

  const closeSlider = () => {
    setIsOpen(false)
  }

  const openSlider = () => {
    setIsOpen(true)
  }

  // Prevent body scroll when slider is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm relative"
        title="Cart"
        onClick={openSlider}
      >
        <ShoppingCart className="w-5 h-5" />

        {count > 0 && (
          <span
            aria-live="polite"
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-medium"
          >
            {count}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] transition-opacity"
          onClick={closeSlider}
        />
      )}

      {/* Slider Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-base-100 shadow-2xl z-[80] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle"
              onClick={closeSlider}
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-hidden">
            <MiniCart onClose={closeSlider} />
          </div>
        </div>
      </div>
    </>
  )
}
