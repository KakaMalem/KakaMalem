'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ShoppingCart, X } from 'lucide-react'
import { useCart, getCartItemCount } from '@/providers'
import MiniCart from '../MiniCart'

export default function CartButton() {
  const { cart } = useCart()
  const count = getCartItemCount(cart)
  const [isOpen, setIsOpen] = useState(false)
  const isManualClose = useRef(false)

  const closeSlider = () => {
    isManualClose.current = true
    setIsOpen(false)
  }

  const openSlider = () => {
    setIsOpen(true)
  }

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        isManualClose.current = false
        setIsOpen(false)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen])

  // Manage browser history state
  useEffect(() => {
    if (isOpen) {
      // Push a state when cart opens
      window.history.pushState({ cartOpen: true }, '')
    } else if (isManualClose.current) {
      // Go back when manually closing to remove the cart state
      isManualClose.current = false
      window.history.back()
    }
  }, [isOpen])

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
        className="btn btn-ghost btn-circle btn-sm relative hover:bg-base-200"
        title="Cart"
        onClick={openSlider}
      >
        <ShoppingCart className="w-5 h-5" />

        {count > 0 && (
          <span
            aria-live="polite"
            className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-bold shadow-md"
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
