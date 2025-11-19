'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/providers/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { ShippingStep } from '@/app/(frontend)/components/checkout/ShippingStep'
import { PaymentStep } from '@/app/(frontend)/components/checkout/PaymentStep'
import { ReviewStep } from '@/app/(frontend)/components/checkout/ReviewStep'

interface CheckoutClientProps {
  user: User | null
}

interface GuestFormData {
  email: string
  firstName: string
  lastName: string
  state: string
  country: string
  phone: string
  nearbyLandmark: string
  detailedDirections: string
  coordinates: {
    latitude: number | null
    longitude: number | null
  }
}

export default function CheckoutClient({ user }: CheckoutClientProps) {
  const { cart: cartData, loading: cartLoading, clearCart } = useCart()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'credit_card'>('cod')
  const [guestForm, setGuestForm] = useState<GuestFormData>({
    email: '',
    firstName: '',
    lastName: '',
    state: '',
    country: '',
    phone: '',
    nearbyLandmark: '',
    detailedDirections: '',
    coordinates: {
      latitude: null,
      longitude: null,
    },
  })

  const userAddresses = user?.addresses || []
  const currency = user?.preferences?.currency || 'USD'
  const cart = cartData?.items || []

  const steps = [
    { number: 1, name: 'Shipping', component: 'shipping' },
    { number: 2, name: 'Payment', component: 'payment' },
    { number: 3, name: 'Review', component: 'review' },
  ]

  // Auto-select default address
  useEffect(() => {
    if (userAddresses.length > 0 && selectedAddressIndex === null) {
      const defaultIndex = userAddresses.findIndex((addr) => addr.isDefault)
      setSelectedAddressIndex(defaultIndex >= 0 ? defaultIndex : 0)
    }
  }, [userAddresses, selectedAddressIndex])

  // Redirect if cart is empty (but not when order is being placed)
  useEffect(() => {
    if (!cartLoading && (!cart || cart.length === 0) && !orderPlaced) {
      toast.error('Your cart is empty. Add items to checkout.')
      router.push('/cart')
    }
  }, [cart, cartLoading, router, orderPlaced])

  // Show loading while checking cart
  if (cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // If cart is empty and not in process of placing order, don't render checkout
  if ((!cart || cart.length === 0) && !orderPlaced) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  const subtotal = cart.reduce((sum, item) => {
    if (!item.product) return sum
    const price = item.product.salePrice || item.product.price
    return sum + price * item.quantity
  }, 0)

  const shipping = subtotal > 100 ? 0 : 10
  const total = subtotal + shipping

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validate shipping step
        if (user) {
          if (selectedAddressIndex === null) {
            toast.error('Please select a shipping address')
            return false
          }
        } else {
          if (
            !guestForm.email ||
            !guestForm.firstName ||
            !guestForm.lastName ||
            !guestForm.country
          ) {
            toast.error('Please fill in all required fields')
            return false
          }
        }
        return true
      case 2:
        // Payment step is always valid (at least COD is selected)
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!validateStep(currentStep)) {
      return
    }

    setProcessing(true)

    try {
      let shippingAddress
      let guestEmail

      if (user) {
        // Authenticated user - use selected address
        shippingAddress = userAddresses[selectedAddressIndex!]
      } else {
        // Guest user - use form data
        guestEmail = guestForm.email
        shippingAddress = {
          firstName: guestForm.firstName,
          lastName: guestForm.lastName,
          state: guestForm.state,
          country: guestForm.country,
          phone: guestForm.phone,
          nearbyLandmark: guestForm.nearbyLandmark,
          detailedDirections: guestForm.detailedDirections,
          coordinates: guestForm.coordinates,
        }
      }

      // Prepare cart items for the order
      const items = cart.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      }))

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shippingAddress,
          paymentMethod,
          currency,
          items,
          guestEmail, // Include guest email if not logged in
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      setOrderPlaced(true)
      await clearCart()

      // Redirect to order confirmation page
      router.push(`/order-confirmation/${data.order.id}`)
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Failed to place order')
    } finally {
      setProcessing(false)
    }
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
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep === step.number
                        ? 'bg-primary text-primary-content scale-110'
                        : currentStep > step.number
                        ? 'bg-success text-success-content'
                        : 'bg-base-300 text-base-content'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      currentStep === step.number ? 'text-primary' : 'opacity-70'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 rounded transition-all ${
                      currentStep > step.number ? 'bg-success' : 'bg-base-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Shipping */}
        {currentStep === 1 && (
          <ShippingStep
            user={user}
            selectedAddressIndex={selectedAddressIndex}
            setSelectedAddressIndex={setSelectedAddressIndex}
            guestForm={guestForm}
            setGuestForm={setGuestForm}
          />
        )}

        {/* Step 2: Payment */}
        {currentStep === 2 && (
          <PaymentStep paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <ReviewStep
            user={user}
            cart={cart}
            currency={currency}
            selectedAddressIndex={selectedAddressIndex}
            guestForm={guestForm}
            paymentMethod={paymentMethod}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-8">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < 3 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handlePlaceOrder}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Processing Order...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Place Order ({currency} {total.toFixed(2)})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
