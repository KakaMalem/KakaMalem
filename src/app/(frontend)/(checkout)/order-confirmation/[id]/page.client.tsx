'use client'

import React from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Mail,
  ArrowRight,
  ShoppingBag,
  FileText,
} from 'lucide-react'
import type { Order, Product, ProductVariant, Media } from '@/payload-types'
import confetti from 'canvas-confetti'
import Image from 'next/image'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

interface OrderItem {
  product: string | Product
  variant?: string | ProductVariant | null
  quantity: number
  price?: number
  total?: number
}

interface OrderConfirmationClientProps {
  order: Order
}

export default function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const [confettiShown, setConfettiShown] = React.useState(false)
  const currency = order.currency || 'AFN'
  const isGuest = !order.customer

  // Show confetti on mount
  React.useEffect(() => {
    if (!confettiShown) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
      setConfettiShown(true)
    }
  }, [confettiShown])

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: 'Cash on Delivery',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
    }
    return labels[method] || method
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-success/20 to-success/5 border-b border-success/20">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <Breadcrumb items={[{ label: 'Checkout', href: '/checkout' }, { label: 'Order Confirmation', active: true }]} />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success text-success-content rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Order Confirmed!</h1>
          <p className="text-lg opacity-80 mb-2">
            Thank you for your order. We&apos;ve received it and will process it shortly.
          </p>
          <div className="inline-block bg-base-200 px-6 py-3 rounded-lg mt-4">
            <div className="text-sm opacity-70">Order Number</div>
            <div className="text-2xl font-bold text-primary">{order.orderNumber}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Guest Notice */}
        {isGuest && order.guestEmail && (
          <div className="alert alert-info mb-6">
            <Mail className="w-5 h-5" />
            <div>
              <div className="font-semibold">Order confirmation sent!</div>
              <div className="text-sm">
                We&apos;ve sent a confirmation email to <strong>{order.guestEmail}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {!isGuest ? (
            <>
              <Link href={`/account/orders/${order.id}`} className="btn btn-primary btn-lg gap-2">
                <FileText className="w-5 h-5" />
                View Order Details
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/" className="btn btn-outline btn-lg gap-2">
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className="btn btn-primary btn-lg gap-2">
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>
              <Link href="/auth/register" className="btn btn-outline btn-lg gap-2">
                Create Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                {(order.items as OrderItem[]).map((item, index: number) => {
                  const product = typeof item.product === 'object' ? item.product : null
                  const variant = typeof item.variant === 'object' ? item.variant : null

                  // Get the appropriate image - variant image first, then product image
                  const getImageUrl = (): string | null => {
                    // Try variant images first
                    if (
                      variant?.images &&
                      Array.isArray(variant.images) &&
                      variant.images.length > 0
                    ) {
                      const firstImage = variant.images[0]
                      if (typeof firstImage === 'string') return firstImage
                      if (typeof firstImage === 'object' && (firstImage as Media)?.url) {
                        return (firstImage as Media).url ?? null
                      }
                    }

                    // Fall back to product images
                    if (
                      product?.images &&
                      Array.isArray(product.images) &&
                      product.images.length > 0
                    ) {
                      const firstImage = product.images[0]
                      if (typeof firstImage === 'string') return firstImage
                      if (typeof firstImage === 'object' && (firstImage as Media)?.url) {
                        return (firstImage as Media).url ?? null
                      }
                    }

                    return null
                  }

                  const imageUrl = getImageUrl()

                  // Get variant label for display
                  const variantLabel = variant?.options
                    ?.map((opt) => `${opt.name}: ${opt.value}`)
                    .join(', ')

                  return (
                    <div key={index} className="flex gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-lg">
                          <Image
                            src={imageUrl || PLACEHOLDER_IMAGE}
                            alt={product?.name || 'Product'}
                            width={64}
                            height={64}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-2">{product?.name || 'Product'}</div>
                        {variantLabel && (
                          <div className="text-xs text-base-content/60 mt-0.5">{variantLabel}</div>
                        )}
                        <div className="text-sm opacity-70">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {currency} {item.total?.toFixed(2) || '0.00'}
                        </div>
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
                    {currency} {order.subtotal?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Shipping</span>
                  <span className="font-medium">
                    {order.shipping === 0 ? (
                      <span className="text-success">FREE</span>
                    ) : (
                      `${currency} ${order.shipping?.toFixed(2) || '0.00'}`
                    )}
                  </span>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {currency} {order.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Shipping Address
                </h2>

                <div className="space-y-1 text-sm">
                  <div className="font-semibold">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </div>
                  {order.shippingAddress.state && <div>{order.shippingAddress.state}</div>}
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.phone && (
                    <div className="mt-2">
                      <span className="opacity-70">Phone:</span> {order.shippingAddress.phone}
                    </div>
                  )}

                  {/* Location Details for Delivery */}
                  {(order.shippingAddress.nearbyLandmark ||
                    order.shippingAddress.detailedDirections ||
                    order.shippingAddress.coordinates) && (
                    <>
                      <div className="divider my-2"></div>
                      <div className="text-xs font-semibold text-primary mb-1">
                        Delivery Instructions:
                      </div>
                      {order.shippingAddress.nearbyLandmark && (
                        <div className="flex items-start gap-2 bg-info/10 p-2 rounded">
                          <MapPin className="w-4 h-4 mt-0.5 text-info flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium">Landmark:</div>
                            <div>{order.shippingAddress.nearbyLandmark}</div>
                          </div>
                        </div>
                      )}
                      {order.shippingAddress.detailedDirections && (
                        <div className="bg-base-100 p-2 rounded">
                          <div className="text-xs font-medium mb-1">Directions:</div>
                          <div className="text-xs opacity-80 whitespace-pre-line">
                            {order.shippingAddress.detailedDirections}
                          </div>
                        </div>
                      )}
                      {order.shippingAddress.coordinates?.latitude &&
                        order.shippingAddress.coordinates?.longitude && (
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=${order.shippingAddress.coordinates?.latitude},${order.shippingAddress.coordinates?.longitude}`,
                                '_blank',
                              )
                            }
                            className="btn btn-sm btn-primary gap-2 w-full"
                          >
                            <MapPin className="w-4 h-4" />
                            Open in Google Maps
                          </button>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Method
                </h2>

                <div className="text-sm">
                  <div className="font-medium">
                    {order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod) : 'N/A'}
                  </div>
                  <div className="opacity-70 mt-1">
                    Status: <span className="badge badge-warning badge-sm">Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="card bg-primary text-primary-content">
              <div className="card-body">
                <h3 className="card-title text-lg">What&apos;s Next?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>We&apos;ll send you an email confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your order will be processed within 1-2 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You&apos;ll receive tracking information once shipped</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Account Creation CTA */}
        {isGuest && (
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 mt-8">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold mb-2">Want to Track Your Order?</h3>
              <p className="opacity-80 mb-4">
                Create an account to view your order history and track shipments anytime.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/register" className="btn btn-primary gap-2">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/auth/login" className="btn btn-outline">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
