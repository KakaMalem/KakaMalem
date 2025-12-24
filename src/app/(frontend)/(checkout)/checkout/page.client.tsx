'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useCart } from '@/providers/cart'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { ShippingStep, type GuestFormData } from '@/app/(frontend)/components/checkout/ShippingStep'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'
import {
  PaymentStep,
  type PaymentMethodType,
} from '@/app/(frontend)/components/checkout/PaymentStep'
import { ReviewStep } from '@/app/(frontend)/components/checkout/ReviewStep'

type ShippingMode = 'always_free' | 'free_above_threshold' | 'always_charged'

interface ShippingSettings {
  mode: ShippingMode
  cost: number
  freeThreshold: number
}

export interface CheckoutClientProps {
  user: User | null
  shipping: ShippingSettings
}

export default function CheckoutClient({ user, shipping }: CheckoutClientProps) {
  const { cart: cartData, loading: cartLoading, clearCart } = useCart()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod')
  const [guestForm, setGuestForm] = useState<GuestFormData>({
    email: '',
    firstName: '',
    lastName: '',
    state: 'کابل',
    country: 'افغانستان',
    phone: '',
    nearbyLandmark: '',
    detailedDirections: '',
    coordinates: {
      latitude: null,
      longitude: null,
    },
  })

  // FIX: Memoize these values to prevent referential instability on every render
  const userAddresses = useMemo(() => user?.addresses || [], [user])
  const cart = useMemo(() => cartData?.items || [], [cartData])

  const currency = user?.preferences?.currency || 'AFN'

  const steps = [
    { number: 1, name: 'آدرس تحویل', component: 'shipping' },
    { number: 2, name: 'روش پرداخت', component: 'payment' },
    { number: 3, name: 'بررسی نهایی', component: 'review' },
  ]

  // Auto-select default address or newly added address
  useEffect(() => {
    if (userAddresses.length > 0) {
      if (selectedAddressIndex === null || selectedAddressIndex >= userAddresses.length) {
        const defaultIndex = userAddresses.findIndex((addr) => addr.isDefault)
        // Select default address, or the last added address (most recent)
        setSelectedAddressIndex(defaultIndex >= 0 ? defaultIndex : userAddresses.length - 1)
      }
    }
  }, [userAddresses, selectedAddressIndex])

  // Redirect if cart is empty (but not when order is being placed)
  useEffect(() => {
    if (!cartLoading && (!cart || cart.length === 0) && !orderPlaced) {
      toast.error('سبد خرید شما خالی است. لطفاً محصولاتی را اضافه کنید.')
      router.push('/')
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
    // Use variant price if available, otherwise product price
    const price = item.variant?.price || item.product.salePrice || item.product.price
    return sum + price * item.quantity
  }, 0)

  // Calculate shipping cost based on mode
  const calculateShippingCost = (): number => {
    switch (shipping.mode) {
      case 'always_free':
        return 0
      case 'always_charged':
        return shipping.cost
      case 'free_above_threshold':
      default:
        return subtotal >= shipping.freeThreshold ? 0 : shipping.cost
    }
  }
  const shippingCost = calculateShippingCost()
  const total = subtotal + shippingCost

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validate shipping step
        if (user) {
          if (userAddresses.length === 0) {
            toast.error('لطفاً ابتدا یک آدرس اضافه کنید')
            return false
          }
          if (selectedAddressIndex === null) {
            toast.error('لطفاً آدرس تحویل را انتخاب کنید')
            return false
          }
        } else {
          // Validate all required guest form fields
          // Note: nearbyLandmark and detailedDirections are now optional
          const requiredFields: { field: keyof GuestFormData; label: string }[] = [
            { field: 'firstName', label: 'نام' },
            { field: 'lastName', label: 'تخلص' },
            { field: 'email', label: 'ایمیل' },
            { field: 'phone', label: 'شماره تماس' },
          ]

          for (const { field, label } of requiredFields) {
            const value = guestForm[field]
            if (typeof value === 'string' && !value.trim()) {
              toast.error(`لطفاً ${label} را وارد کنید`)
              return false
            }
          }

          // Validate email format
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email)) {
            toast.error('فرمت ایمیل نامعتبر است')
            return false
          }

          // Validate phone format
          if (!/^[+\d\s()-]+$/.test(guestForm.phone)) {
            toast.error('فرمت شماره تماس نامعتبر است')
            return false
          }

          // Validate coordinates are required
          if (!guestForm.coordinates.latitude || !guestForm.coordinates.longitude) {
            toast.error('لطفاً موقعیت تحویل را مشخص کنید')
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
      toast.error('سبد خرید شما خالی است')
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
        // Always include user email for fallback authentication
        guestEmail = user.email
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

      // Prepare cart items for the order - include variant if present
      const items = cart.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        ...(item.variantId && { variantId: item.variantId }),
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
        throw new Error(data.error || 'ایجاد سفارش با خطا مواجه شد')
      }

      setOrderPlaced(true)
      await clearCart()

      // Redirect to order confirmation page
      router.push(`/order-confirmation/${data.order.id}`)
    } catch (error: unknown) {
      console.error('Checkout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'ثبت سفارش با خطا مواجه شد'
      toast.error(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Breadcrumb items={[{ label: 'تصفیه حساب', active: true }]} />
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="w-8 h-8 text-primary mb-4 mt-4" />
            <h1 className="text-3xl font-bold">تصفیه حساب</h1>
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
                    {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
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
            shippingCost={shippingCost}
            total={total}
            shippingSettings={shipping}
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
            <ArrowRight className="w-4 h-4" />
            بازگشت
          </button>

          {currentStep < 3 ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              ادامه
              <ArrowLeft className="w-4 h-4" />
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
                  در حال پردازش سفارش...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  ثبت نهایی سفارش
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
