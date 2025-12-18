'use client'

import React from 'react'
import { Truck, MapPin, CreditCard } from 'lucide-react'
import type { User, Media } from '@/payload-types'
import type { CartItem } from '@/providers/cart/types'
import Image from 'next/image'
import { PLACEHOLDER_IMAGE } from '@/utilities/ui'

/**
 * Extract URL from a Media object or string
 * Handles various formats: string ID, Media object, or object with url property
 */
const extractMediaUrl = (mediaItem: unknown): string | null => {
  if (typeof mediaItem === 'string') return mediaItem

  if (typeof mediaItem === 'object' && mediaItem !== null) {
    const media = mediaItem as Media | { url?: string | null }

    // Try Media.url first
    if ('url' in media && typeof media.url === 'string' && media.url) {
      return media.url
    }

    // Try generic url property
    const possibleUrl = (media as { url?: string | null }).url
    if (typeof possibleUrl === 'string' && possibleUrl) {
      return possibleUrl
    }
  }

  return null
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
    accuracy?: number | null
    source?: 'gps' | 'ip' | 'manual' | 'map' | null
    ip?: string | null
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
    cod: 'پرداخت هنگام تحویل',
    bank_transfer: 'انتقال بانکی',
    credit_card: 'کارت اعتباری',
  }[paymentMethod]

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
          <Truck className="w-6 h-6 text-primary" />
          بررسی نهایی سفارش
        </h2>

        {/* Shipping Address Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            آدرس تحویل گیرنده
          </h3>
          {shippingAddress ? (
            <div className="space-y-1 bg-base-100 p-4 rounded-lg">
              {!user && <div className="font-medium">{guestForm.email}</div>}
              <div>
                {shippingAddress.firstName} {shippingAddress.lastName}
              </div>
              {shippingAddress.state && (
                <div className="text-sm opacity-70">{shippingAddress.state}</div>
              )}
              <div className="text-sm opacity-70">{shippingAddress.country}</div>
              {shippingAddress.phone && (
                <div className="text-sm opacity-70">
                  شماره تماس: <span dir="ltr">{shippingAddress.phone}</span>
                </div>
              )}
              {shippingAddress.nearbyLandmark && (
                <div className="text-sm opacity-70">نشانی: {shippingAddress.nearbyLandmark}</div>
              )}
              {shippingAddress.detailedDirections && (
                <div className="text-sm opacity-70 mt-2 border-t border-base-300 pt-2">
                  مسیر: {shippingAddress.detailedDirections}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm opacity-70">آدرسی انتخاب نشده است</div>
          )}
        </div>

        <div className="divider"></div>

        {/* Payment Method Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            روش پرداخت
          </h3>
          <div className="font-medium bg-base-100 p-4 rounded-lg">{paymentMethodLabel}</div>
        </div>

        <div className="divider"></div>

        {/* Order Items Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">اقلام سفارش</h3>

          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto bg-base-100 p-4 rounded-lg">
            {cart.map((item) => {
              const product = item.product
              if (!product) return null

              // Get the appropriate price - variant price first, then product price
              const price = item.variant?.price || product.salePrice || product.price

              // Get the appropriate image using proper prioritization
              const getImageUrl = (): string => {
                // Priority 1: Variant images
                if (
                  item.variant?.images &&
                  Array.isArray(item.variant.images) &&
                  item.variant.images.length > 0
                ) {
                  const url = extractMediaUrl(item.variant.images[0])
                  if (url) return url
                }

                // Priority 2: Product main images
                if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                  const url = extractMediaUrl(product.images[0])
                  if (url) return url
                }

                // Priority 3: Placeholder
                return PLACEHOLDER_IMAGE
              }

              const imageUrl = getImageUrl()

              // Get variant label for display
              const variantLabel = item.variant?.options
                ?.map((opt) => `${opt.name}: ${opt.value}`)
                .join(', ')

              return (
                <div
                  key={`${item.productId}-${item.variantId || 'no-variant'}`}
                  className="flex gap-3 pb-3 border-b border-base-300 last:border-b-0 last:pb-0"
                >
                  <div className="avatar">
                    <div className="w-16 h-16 rounded-lg">
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-2">{product.name}</div>
                    {variantLabel && (
                      <div className="text-xs text-base-content/60 mt-0.5">{variantLabel}</div>
                    )}
                    <div className="text-sm opacity-70">تعداد: {item.quantity}</div>
                  </div>
                  <div className="font-bold whitespace-nowrap">
                    {currency} {(price * item.quantity).toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="divider"></div>

        {/* Order Summary Section */}
        <div className="space-y-3 bg-base-100 p-4 rounded-lg">
          <div className="flex justify-between">
            <span className="opacity-70">جمع جزء</span>
            <span className="font-medium">
              {subtotal.toFixed(2)} {currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-70">هزینه ارسال</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <span className="text-success">رایگان</span>
              ) : (
                `${shipping.toFixed(2)} ${currency}`
              )}
            </span>
          </div>
          <div className="divider my-2"></div>
          <div className="flex justify-between text-xl font-bold">
            <span>جمع کل</span>
            <span className="text-primary">
              {total.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="alert alert-info mt-4">
          <Truck className="w-5 h-5" />
          <div className="text-sm">
            <div className="font-medium">ارسال رایگان</div>
            <div className="opacity-70">
              سفارش‌های بالای 1000 {currency} از ارسال رایگان برخوردارند
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
