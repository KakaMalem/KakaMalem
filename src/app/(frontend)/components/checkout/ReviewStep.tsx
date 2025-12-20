'use client'

import React from 'react'
import {
  Truck,
  MapPin,
  CreditCard,
  Package,
  Check,
  ShoppingBag,
  Phone,
  Mail,
  Navigation,
} from 'lucide-react'
import type { User, Media } from '@/payload-types'
import type { CartItem } from '@/providers/cart/types'
import Image from 'next/image'
import { PLACEHOLDER_IMAGE, extractMediaUrl } from '@/utilities/ui'
import { formatPrice } from '@/utilities/currency'
import type { GuestFormData } from './ShippingStep'
import type { PaymentMethodType } from './PaymentStep'

type ShippingMode = 'always_free' | 'free_above_threshold' | 'always_charged'

const FREE_DELIVERY_BADGE_TEXT = 'ارسال رایگان'

interface ShippingSettings {
  mode: ShippingMode
  cost: number
  freeThreshold: number
}

interface ReviewStepProps {
  user: User | null
  cart: CartItem[]
  currency: string
  selectedAddressIndex: number | null
  guestForm: GuestFormData
  paymentMethod: PaymentMethodType
  subtotal: number
  shippingCost: number
  total: number
  shippingSettings: ShippingSettings
}

// Payment method display labels
const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cod: 'پرداخت هنگام تحویل',
  bank_transfer: 'انتقال بانکی',
  credit_card: 'کارت اعتباری',
}

export function ReviewStep({
  user,
  cart,
  currency,
  selectedAddressIndex,
  guestForm,
  paymentMethod,
  subtotal,
  shippingCost,
  total,
  shippingSettings,
}: ReviewStepProps) {
  const userAddresses = user?.addresses || []
  const shippingAddress = user
    ? selectedAddressIndex !== null
      ? userAddresses[selectedAddressIndex]
      : null
    : guestForm

  const paymentMethodLabel = PAYMENT_METHOD_LABELS[paymentMethod]

  // Get the appropriate image using proper prioritization
  const getImageUrl = (item: CartItem): string => {
    // Priority 1: Variant images
    if (
      item.variant?.images &&
      Array.isArray(item.variant.images) &&
      item.variant.images.length > 0
    ) {
      const url = extractMediaUrl(item.variant.images[0] as Media | string)
      if (url) return url
    }

    // Priority 2: Product main images
    if (
      item.product?.images &&
      Array.isArray(item.product.images) &&
      item.product.images.length > 0
    ) {
      const url = extractMediaUrl(item.product.images[0] as Media | string)
      if (url) return url
    }

    // Priority 3: Placeholder
    return PLACEHOLDER_IMAGE
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-primary" />
          </div>
          بررسی نهایی سفارش
        </h2>

        {/* Shipping Address Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            آدرس تحویل گیرنده
          </h3>
          {shippingAddress ? (
            <div className="bg-base-100 p-4 rounded-xl border border-base-300">
              {/* Guest email */}
              {!user && guestForm.email && (
                <div className="flex items-center gap-2 text-sm text-base-content/70 mb-2 pb-2 border-b border-base-300">
                  <Mail className="w-4 h-4" />
                  <span dir="ltr">{guestForm.email}</span>
                </div>
              )}

              {/* Name */}
              <div className="font-semibold text-base-content">
                {shippingAddress.firstName} {shippingAddress.lastName}
              </div>

              {/* Location */}
              <div className="text-sm text-base-content/70 mt-1">
                {shippingAddress.state && <span>{shippingAddress.state}، </span>}
                {shippingAddress.country}
              </div>

              {/* Phone */}
              {shippingAddress.phone && (
                <div className="flex items-center gap-2 text-sm text-base-content/70 mt-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span dir="ltr">{shippingAddress.phone}</span>
                </div>
              )}

              {/* Nearby Landmark */}
              {shippingAddress.nearbyLandmark && (
                <div className="flex items-start gap-2 text-sm text-base-content/70 mt-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{shippingAddress.nearbyLandmark}</span>
                </div>
              )}

              {/* Detailed Directions */}
              {shippingAddress.detailedDirections && (
                <div className="mt-3 pt-3 border-t border-base-300">
                  <div className="flex items-start gap-2 text-sm text-base-content/70">
                    <Navigation className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{shippingAddress.detailedDirections}</span>
                  </div>
                </div>
              )}

              {/* GPS Status */}
              {shippingAddress.coordinates?.latitude && shippingAddress.coordinates?.longitude && (
                <div className="flex items-center gap-1.5 text-xs text-success mt-3">
                  <Check className="w-3.5 h-3.5" />
                  موقعیت GPS ثبت شده
                </div>
              )}
            </div>
          ) : (
            <div className="bg-base-100 p-4 rounded-xl border border-warning/30 text-warning">
              آدرسی انتخاب نشده است
            </div>
          )}
        </div>

        <div className="divider my-2"></div>

        {/* Payment Method Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            روش پرداخت
          </h3>
          <div className="bg-base-100 p-4 rounded-xl border border-base-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-success" />
            </div>
            <span className="font-medium">{paymentMethodLabel}</span>
          </div>
        </div>

        <div className="divider my-2"></div>

        {/* Order Items Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            اقلام سفارش
            <span className="badge badge-primary badge-sm mr-1">{cart.length} مورد</span>
          </h3>

          <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {cart.map((item, index) => {
                const product = item.product
                if (!product) return null

                // Get the appropriate price - variant price first, then product price
                const price = item.variant?.price || product.salePrice || product.price
                const imageUrl = getImageUrl(item)

                // Get variant label for display
                const variantLabel = item.variant?.options
                  ?.map((opt) => `${opt.name}: ${opt.value}`)
                  .join(' • ')

                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'no-variant'}`}
                    className={`flex gap-4 p-4 ${index !== cart.length - 1 ? 'border-b border-base-300' : ''}`}
                  >
                    <div className="avatar">
                      <div className="w-16 h-16 rounded-lg bg-base-200">
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
                      <div className="font-medium line-clamp-2 text-sm">{product.name}</div>
                      {variantLabel && (
                        <div className="text-xs text-base-content/60 mt-1">{variantLabel}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="badge badge-ghost badge-sm">تعداد: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <div className="font-bold text-primary">
                        {formatPrice(price * item.quantity, currency)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-xs text-base-content/50 mt-0.5">
                          هر عدد {formatPrice(price, currency)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="divider my-2"></div>

        {/* Order Summary Section */}
        <div className="bg-base-100 p-5 rounded-xl border border-base-300">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            خلاصه سفارش
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base-content/70">جمع جزء ({cart.length} مورد)</span>
              <span className="font-medium">{formatPrice(subtotal, currency)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-base-content/70 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                هزینه ارسال
              </span>
              <span className="font-medium">
                {shippingCost === 0 ? (
                  <span className="badge badge-success gap-1">
                    <Check className="w-3 h-3" />
                    رایگان
                  </span>
                ) : (
                  formatPrice(shippingCost, currency)
                )}
              </span>
            </div>

            <div className="divider my-3"></div>

            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">جمع کل</span>
              <span className="font-bold text-xl text-primary">{formatPrice(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Free Delivery Info - only show for threshold mode */}
        {shippingSettings.mode === 'free_above_threshold' && (
          <div className="mt-4 p-4 bg-success/5 rounded-xl border border-success/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-success" />
              </div>
              <div>
                <div className="font-semibold text-success">{FREE_DELIVERY_BADGE_TEXT}</div>
                <p className="text-sm text-base-content/70 mt-0.5">
                  سفارش‌های بالای {formatPrice(shippingSettings.freeThreshold, 'AFN')} از{' '}
                  {FREE_DELIVERY_BADGE_TEXT} برخوردارند
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
