'use client'

import React from 'react'
import { Truck, MapPin, CreditCard } from 'lucide-react'
import type { User } from '@/payload-types'

interface CartItem {
  productId: string
  quantity: number
  product: any
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

interface ReviewStepProps {
  user: User | null
  cart: CartItem[]
  currency: string
  selectedAddressIndex: number | null
  guestForm: GuestFormData
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card'
  subtotal: number
  shipping: number
  total: number
}

export function ReviewStep({
  user,
  cart,
  currency,
  selectedAddressIndex,
  guestForm,
  paymentMethod,
  subtotal,
  shipping,
  total,
}: ReviewStepProps) {
  const userAddresses = user?.addresses || []
  const shippingAddress = user
    ? selectedAddressIndex !== null
      ? userAddresses[selectedAddressIndex]
      : null
    : guestForm

  const paymentMethodLabel = {
    cod: 'Cash on Delivery',
    bank_transfer: 'Bank Transfer',
    credit_card: 'Credit Card',
  }[paymentMethod]

  return (
    <div className="space-y-6">
      {/* Shipping Address Summary */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Shipping Address
          </h2>
          {shippingAddress ? (
            <div className="space-y-1">
              {!user && <div className="font-medium">{guestForm.email}</div>}
              <div>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </div>
              {shippingAddress.state && <div className="text-sm opacity-70">{shippingAddress.state}</div>}
              <div className="text-sm opacity-70">{shippingAddress.country}</div>
              {shippingAddress.phone && <div className="text-sm opacity-70">Phone: {shippingAddress.phone}</div>}
              {shippingAddress.nearbyLandmark && (
                <div className="text-sm opacity-70">Landmark: {shippingAddress.nearbyLandmark}</div>
              )}
              {shippingAddress.detailedDirections && (
                <div className="text-sm opacity-70 mt-2 border-t pt-2">
                  Directions: {shippingAddress.detailedDirections}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm opacity-70">No address selected</div>
          )}
        </div>
      </div>

      {/* Payment Method Summary */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Method
          </h2>
          <div className="font-medium">{paymentMethodLabel}</div>
        </div>
      </div>

      {/* Order Summary */}
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

      {/* Shipping Info */}
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
  )
}
