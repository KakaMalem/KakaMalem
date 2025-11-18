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
import type { Order } from '@/payload-types'
import confetti from 'canvas-confetti'

interface OrderConfirmationClientProps {
  order: Order
}

export default function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const [confettiShown, setConfettiShown] = React.useState(false)
  const currency = order.currency || 'USD'
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success text-success-content rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Order Confirmed!</h1>
          <p className="text-lg opacity-80 mb-2">
            Thank you for your order. We've received it and will process it shortly.
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
                We've sent a confirmation email to <strong>{order.guestEmail}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {!isGuest ? (
            <>
              <Link
                href={`/account/orders/${order.id}`}
                className="btn btn-primary btn-lg gap-2"
              >
                <FileText className="w-5 h-5" />
                View Order Details
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop" className="btn btn-outline btn-lg gap-2">
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>
            </>
          ) : (
            <>
              <Link href="/shop" className="btn btn-primary btn-lg gap-2">
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
                {order.items.map((item: any, index: number) => {
                  const product = item.product
                  const imageUrl =
                    typeof product?.images?.[0] === 'object'
                      ? product.images[0]?.url
                      : product?.images?.[0]

                  return (
                    <div key={index} className="flex gap-3 p-3 bg-base-100 rounded-lg">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-lg">
                          <img
                            src={imageUrl || '/placeholder.jpg'}
                            alt={product?.name || 'Product'}
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium line-clamp-2">{product?.name || 'Product'}</div>
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
                  <div>{order.shippingAddress.address1}</div>
                  {order.shippingAddress.address2 && <div>{order.shippingAddress.address2}</div>}
                  <div>
                    {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  </div>
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.phone && (
                    <div className="mt-2">
                      <span className="opacity-70">Phone:</span> {order.shippingAddress.phone}
                    </div>
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
                <h3 className="card-title text-lg">What's Next?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>We'll send you an email confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Your order will be processed within 1-2 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>You'll receive tracking information once shipped</span>
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
