'use client'

import React, { useState, useEffect } from 'react'
import { useCart } from '@/providers/cart'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, CreditCard, Check, Plus, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { LocationPicker } from '@/app/(frontend)/components/LocationPicker'

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
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  // If cart is empty and not in process of placing order, don't render checkout
  if ((!cart || cart.length === 0) && !orderPlaced) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // For authenticated users, check if address is selected
    if (user && selectedAddressIndex === null) {
      toast.error('Please select a shipping address')
      return
    }

    // For guest users, validate form
    if (!user) {
      if (!guestForm.email || !guestForm.firstName || !guestForm.lastName || !guestForm.country) {
        toast.error('Please fill in all required fields')
        return
      }
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
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/cart" className="btn btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Address Selection / Guest Form */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary" />
                  Shipping Address
                </h2>

                {user ? (
                  // Authenticated user - show saved addresses
                  <>
                    {userAddresses.length > 0 ? (
                      <div className="space-y-3">
                        {userAddresses.map((address, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedAddressIndex === index
                                ? 'border-primary bg-primary/5'
                                : 'border-base-300 hover:border-base-content/20'
                            }`}
                            onClick={() => setSelectedAddressIndex(index)}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                className="radio radio-primary mt-1"
                                checked={selectedAddressIndex === index}
                                onChange={() => setSelectedAddressIndex(index)}
                              />
                              <div>
                                <div className="font-semibold flex items-center gap-2">
                                  {address.label}
                                  {address.isDefault && (
                                    <span className="badge badge-primary badge-sm">Default</span>
                                  )}
                                </div>
                                <div className="text-sm mt-1">
                                  {address.firstName} {address.lastName}
                                </div>
                                {address.state && (
                                  <div className="text-sm opacity-70">{address.state}</div>
                                )}
                                <div className="text-sm opacity-70">{address.country}</div>
                                {address.phone && (
                                  <div className="text-sm opacity-70">Phone: {address.phone}</div>
                                )}
                                {address.nearbyLandmark && (
                                  <div className="text-sm opacity-70 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{address.nearbyLandmark}</span>
                                  </div>
                                )}
                                {address.coordinates?.latitude &&
                                  address.coordinates?.longitude && (
                                    <div className="text-xs text-success mt-1 flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      GPS location set
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <span>
                          You have no saved addresses. Please add one in your account settings.
                        </span>
                      </div>
                    )}

                    <Link
                      href="/account/addresses?redirect=/checkout"
                      className="btn btn-outline btn-sm mt-4"
                    >
                      <Plus className="w-4 h-4" />
                      Manage Addresses
                    </Link>
                  </>
                ) : (
                  // Guest user - show checkout form
                  <div className="space-y-4">
                    <div className="alert alert-info">
                      <span>
                        Checking out as guest. Want to save your info?{' '}
                        <Link href="/auth/login?redirect=/checkout" className="link link-primary">
                          Login
                        </Link>{' '}
                        or{' '}
                        <Link
                          href="/auth/register?redirect=/checkout"
                          className="link link-primary"
                        >
                          Register
                        </Link>
                      </span>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email *</span>
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className="input input-bordered"
                        value={guestForm.email}
                        onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">First Name *</span>
                        </label>
                        <input
                          type="text"
                          placeholder="John"
                          className="input input-bordered"
                          value={guestForm.firstName}
                          onChange={(e) =>
                            setGuestForm({ ...guestForm, firstName: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Last Name *</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Doe"
                          className="input input-bordered"
                          value={guestForm.lastName}
                          onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Province / State</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Kabul, Herat"
                          className="input input-bordered"
                          value={guestForm.state}
                          onChange={(e) => setGuestForm({ ...guestForm, state: e.target.value })}
                        />
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Country *</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Afghanistan"
                          className="input input-bordered"
                          value={guestForm.country}
                          onChange={(e) => setGuestForm({ ...guestForm, country: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Phone</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+93 XXX XXX XXX"
                        className="input input-bordered"
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="divider">Delivery Location (Optional)</div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Nearby Landmark</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Near Blue Mosque, Behind City Hospital"
                        className="input input-bordered"
                        value={guestForm.nearbyLandmark}
                        onChange={(e) =>
                          setGuestForm({ ...guestForm, nearbyLandmark: e.target.value })
                        }
                      />
                      <label className="label">
                        <span className="label-text-alt">Help delivery find your location</span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Detailed Directions</span>
                      </label>
                      <textarea
                        placeholder="Provide detailed directions from the nearest landmark e.g., from shaheed square of shahr e naw, go towards zarghoona high school, after 20 meters you'll see institute of banking and finance of afghanistan, go to the alley infront of it, house number 306, in front of the qala e fathullah mosque"
                        className="textarea textarea-bordered h-24"
                        value={guestForm.detailedDirections}
                        onChange={(e) =>
                          setGuestForm({ ...guestForm, detailedDirections: e.target.value })
                        }
                      />
                      <label className="label">
                        <span className="label-text-alt">
                          Include nearby buildings, turns, or reference points
                        </span>
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">GPS Location</span>
                      </label>
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          setGuestForm({
                            ...guestForm,
                            coordinates: { latitude: lat, longitude: lng },
                          })
                        }}
                        latitude={guestForm.coordinates.latitude ?? undefined}
                        longitude={guestForm.coordinates.longitude ?? undefined}
                      />
                      <label className="label">
                        <span className="label-text-alt">
                          Set your exact location for accurate delivery
                        </span>
                      </label>
                    </div>

                    <div className="alert alert-info text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>
                        Adding GPS location and landmarks helps ensure smooth delivery. Create an
                        account to save this information for future orders!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      value: 'cod',
                      label: 'Cash on Delivery',
                      desc: 'Pay when you receive your order',
                      available: true,
                    },
                    {
                      value: 'bank_transfer',
                      label: 'Bank Transfer',
                      desc: 'Transfer payment to our bank account',
                      available: false,
                    },
                    {
                      value: 'credit_card',
                      label: 'Credit Card',
                      desc: 'Pay securely with your credit card',
                      available: false,
                    },
                  ].map((method) => (
                    <div
                      key={method.value}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        method.available
                          ? paymentMethod === method.value
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'border-base-300 hover:border-base-content/20 cursor-pointer'
                          : 'border-base-300 opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => method.available && setPaymentMethod(method.value as any)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          className="radio radio-primary"
                          checked={paymentMethod === method.value}
                          onChange={() => method.available && setPaymentMethod(method.value as any)}
                          disabled={!method.available}
                        />
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {method.label}
                            {!method.available && (
                              <span className="badge badge-warning badge-sm">Coming Soon</span>
                            )}
                          </div>
                          <div className="text-sm opacity-70">{method.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={handlePlaceOrder}
              disabled={processing || (user ? selectedAddressIndex === null : false)}
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
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4">Order Summary</h3>

                  <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => {
                      const product = item.product
                      if (!product) return null

                      const price = product.salePrice || product.price
                      const imageUrl =
                        typeof product.images?.[0] === 'object'
                          ? product.images[0]?.url
                          : product.images?.[0]

                      return (
                        <div key={item.productId} className="flex gap-3">
                          <div className="avatar">
                            <div className="w-16 h-16 rounded-lg">
                              <img
                                src={imageUrl || '/placeholder.jpg'}
                                alt={product.name}
                                className="object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-2">{product.name}</div>
                            <div className="text-sm opacity-70">Qty: {item.quantity}</div>
                          </div>
                          <div className="font-bold">
                            {currency} {(price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="opacity-70">Subtotal</span>
                      <span className="font-medium">
                        {currency} {subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Shipping</span>
                      <span className="font-medium">
                        {shipping === 0 ? (
                          <span className="text-success">FREE</span>
                        ) : (
                          `${currency} ${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        {currency} {total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="flex items-start gap-3">
                    <Truck className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium mb-1">Free Shipping</div>
                      <div className="opacity-70">
                        Orders over {currency} 100 qualify for free shipping
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
