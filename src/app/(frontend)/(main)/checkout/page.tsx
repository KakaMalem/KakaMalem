'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, MapPin, User, Mail, Phone, Lock, ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  slug: string
}

interface CheckoutFormData {
  // Contact
  email: string
  phone: string

  // Shipping
  firstName: string
  lastName: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string

  // Payment
  cardNumber: string
  cardName: string
  expiryDate: string
  cvv: string

  // Options
  saveInfo: boolean
  sameAsBilling: boolean
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveInfo: false,
    sameAsBilling: true,
  })

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    try {
      const raw = localStorage.getItem('cart')
      const cart = raw ? JSON.parse(raw) : []
      setCartItems(Array.isArray(cart) ? cart : [])

      // Redirect if cart is empty
      if (!cart || cart.length === 0) {
        window.location.href = '/cart'
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.email && formData.phone)
      case 2:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.address1 &&
          formData.city &&
          formData.state &&
          formData.postalCode &&
          formData.country
        )
      case 3:
        return !!(formData.cardNumber && formData.cardName && formData.expiryDate && formData.cvv)
      default:
        return false
    }
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(3)) {
      alert('Please fill in all required fields')
      return
    }

    setProcessing(true)

    try {
      // Replace with actual API call
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address1: formData.address1,
            address2: formData.address2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
            phone: formData.phone,
          },
          contact: {
            email: formData.email,
            phone: formData.phone,
          },
          total,
        }),
      })

      if (response.ok) {
        // Clear cart
        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('cartUpdated'))

        // Redirect to success page
        window.location.href = '/order-success'
      } else {
        throw new Error('Order failed')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('There was an error processing your order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  // Calculate totals
  const subtotal = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0
  const shipping = subtotal > 50 ? 0 : 10
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/cart" className="btn btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <ul className="steps w-full">
            <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Contact</li>
            <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Shipping</li>
            <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Payment</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Contact Information */}
              {currentStep === 1 && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-primary" />
                      Contact Information
                    </h2>

                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Email Address *</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          className="input input-bordered w-full"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Phone Number *</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          className="input input-bordered w-full"
                          placeholder="+1 (555) 000-0000"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-3">
                          <input
                            type="checkbox"
                            name="saveInfo"
                            className="checkbox checkbox-primary"
                            checked={formData.saveInfo}
                            onChange={handleInputChange}
                          />
                          <span className="label-text">Save this information for next time</span>
                        </label>
                      </div>
                    </div>

                    <div className="card-actions justify-end mt-6">
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn btn-primary"
                        disabled={!validateStep(1)}
                      >
                        Continue to Shipping
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-primary" />
                      Shipping Address
                    </h2>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">First Name *</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            className="input input-bordered w-full"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Last Name *</span>
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            className="input input-bordered w-full"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Address Line 1 *</span>
                        </label>
                        <input
                          type="text"
                          name="address1"
                          className="input input-bordered w-full"
                          placeholder="123 Main Street"
                          value={formData.address1}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Address Line 2</span>
                        </label>
                        <input
                          type="text"
                          name="address2"
                          className="input input-bordered w-full"
                          placeholder="Apt, suite, etc. (optional)"
                          value={formData.address2}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">City *</span>
                          </label>
                          <input
                            type="text"
                            name="city"
                            className="input input-bordered w-full"
                            placeholder="New York"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">State *</span>
                          </label>
                          <input
                            type="text"
                            name="state"
                            className="input input-bordered w-full"
                            placeholder="NY"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Postal Code *</span>
                          </label>
                          <input
                            type="text"
                            name="postalCode"
                            className="input input-bordered w-full"
                            placeholder="10001"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Country *</span>
                          </label>
                          <select
                            name="country"
                            className="select select-bordered w-full"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                          >
                            <option>United States</option>
                            <option>Canada</option>
                            <option>United Kingdom</option>
                            <option>Australia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="card-actions justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="btn btn-ghost"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="btn btn-primary"
                        disabled={!validateStep(2)}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Information */}
              {currentStep === 3 && (
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-primary" />
                      Payment Information
                    </h2>

                    <div className="space-y-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Card Number *</span>
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          className="input input-bordered w-full"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">Cardholder Name *</span>
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          className="input input-bordered w-full"
                          placeholder="John Doe"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">Expiry Date *</span>
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            className="input input-bordered w-full"
                            placeholder="MM/YY"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            maxLength={5}
                            required
                          />
                        </div>

                        <div className="form-control">
                          <label className="label">
                            <span className="label-text font-medium">CVV *</span>
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            className="input input-bordered w-full"
                            placeholder="123"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      <div className="alert alert-info">
                        <Lock className="w-5 h-5" />
                        <span className="text-sm">
                          Your payment information is encrypted and secure
                        </span>
                      </div>
                    </div>

                    <div className="card-actions justify-between mt-6">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="btn btn-ghost"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={processing || !validateStep(3)}
                      >
                        {processing ? (
                          <>
                            <span className="loading loading-spinner"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Lock className="w-5 h-5" />
                            Complete Order ${total.toFixed(2)}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4">Order Summary</h3>

                  {/* Cart Items */}
                  <div className="space-y-3 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-lg">
                            <img src={item.image || '/placeholder.jpg'} alt={item.name} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium line-clamp-2">{item.name}</div>
                          <div className="text-sm opacity-70">Qty: {item.quantity}</div>
                        </div>
                        <div className="font-bold">${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="divider"></div>

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="opacity-70">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
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
                    <div className="divider my-2"></div>

                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Secure Checkout</div>
                        <div className="opacity-70 text-xs">SSL encrypted payment</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Money-Back Guarantee</div>
                        <div className="opacity-70 text-xs">30-day return policy</div>
                      </div>
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
