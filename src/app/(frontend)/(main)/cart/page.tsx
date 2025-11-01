'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Lock } from 'lucide-react'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  slug: string
  maxQuantity?: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  )

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    try {
      const raw = localStorage.getItem('cart')
      const cart = raw ? JSON.parse(raw) : []
      // Ensure cart is always an array
      setCartItems(Array.isArray(cart) ? cart : [])
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items))
    setCartItems(items)
    // Dispatch event for header cart count update
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const updatedCart = cartItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.min(newQuantity, item.maxQuantity || 99) }
        : item,
    )
    saveCart(updatedCart)
  }

  const removeItem = (itemId: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId)
    saveCart(updatedCart)
  }

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      saveCart([])
    }
  }

  const applyCoupon = () => {
    // Mock coupon validation - Replace with actual API call
    const validCoupons: Record<string, number> = {
      SAVE10: 10,
      SAVE20: 20,
      WELCOME: 15,
    }

    const discount = validCoupons[couponCode.toUpperCase()]
    if (discount) {
      setAppliedCoupon({ code: couponCode.toUpperCase(), discount })
      setCouponCode('')
    } else {
      alert('Invalid coupon code')
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0
  const shipping = subtotal > 50 ? 0 : 10 // Free shipping over $50
  const tax = (subtotal - discountAmount) * 0.1 // 10% tax
  const total = subtotal - discountAmount + shipping + tax

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-base-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="card bg-base-200 max-w-2xl mx-auto">
            <div className="card-body text-center py-16">
              <ShoppingBag className="w-24 h-24 mx-auto opacity-30 mb-6" />
              <h2 className="text-3xl font-bold mb-4">Your Cart is Empty</h2>
              <p className="text-base-content/70 mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link href="/shop" className="btn btn-primary btn-lg">
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-base-content/70">{cartItems.length} items in your cart</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-4">
            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button onClick={clearCart} className="btn btn-ghost btn-sm text-secondary">
                <Trash2 className="w-4 h-4" />
                Clear Cart
              </button>
            </div>

            {/* Cart Items List */}
            {cartItems.map((item) => (
              <div key={item.id} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                      <div className="w-24 h-24 bg-base-100 rounded-lg overflow-hidden">
                        <img
                          src={item.image || '/placeholder.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-semibold text-lg hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <div className="text-2xl font-bold text-primary mt-2">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-4">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="btn btn-ghost btn-sm btn-square text-accent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="join border border-base-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="btn btn-sm join-item border-none"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="join-item flex items-center justify-center min-w-[50px] px-3 font-semibold">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="btn btn-sm join-item border-none"
                          disabled={item.quantity >= (item.maxQuantity || 99)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm opacity-70">Subtotal</div>
                        <div className="text-xl font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <Link href="/shop" className="btn btn-outline w-full lg:w-auto">
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              {/* Coupon Code */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Coupon Code
                  </h3>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success">
                      <div>
                        <div className="font-medium text-success">{appliedCoupon.code}</div>
                        <div className="text-sm opacity-70">
                          {appliedCoupon.discount}% discount applied
                        </div>
                      </div>
                      <button onClick={removeCoupon} className="btn btn-ghost btn-sm btn-square">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="join w-full">
                      <input
                        type="text"
                        placeholder="Enter code"
                        className="input input-bordered join-item flex-1"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <button onClick={applyCoupon} className="btn btn-primary join-item">
                        Apply
                      </button>
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-2">Try: SAVE10, SAVE20, or WELCOME</div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="opacity-70">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-success">
                        <span className="opacity-70">Discount ({appliedCoupon.discount}%)</span>
                        <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="opacity-70">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-success">FREE</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="opacity-70">Tax (10%)</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>

                    <div className="divider my-2"></div>

                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-lg w-full mt-6">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Trust Badges */}
                  <div className="space-y-2 mt-6 text-sm">
                    <div className="flex items-center gap-2 opacity-70">
                      <Lock className="w-4 h-4" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <Truck className="w-4 h-4" />
                      <span>Free shipping on orders over $50</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="font-semibold mb-3">We Accept</h3>
                  <div className="flex gap-2 flex-wrap">
                    <div className="badge badge-lg badge-outline">Visa</div>
                    <div className="badge badge-lg badge-outline">Mastercard</div>
                    <div className="badge badge-lg badge-outline">PayPal</div>
                    <div className="badge badge-lg badge-outline">Apple Pay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Need Help?</h3>
          <p className="mb-4 opacity-90">
            Our customer service team is here to assist you with any questions.
          </p>
          <button className="btn btn-outline text-white border-white hover:bg-white hover:text-primary">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}
