'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import type { Order, User, Product } from '@/payload-types'
import Image from 'next/image'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

interface OrderItem {
  product: string | Product
  quantity: number
  price?: number
  total?: number
}

interface OrderDetailsClientProps {
  order: Order
  user: User
}

export default function OrderDetailsClient({ order, user }: OrderDetailsClientProps) {
  const currency = order.currency || user.preferences?.currency || 'AFN'

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'badge-warning', icon: <Clock className="w-4 h-4" /> },
      processing: { color: 'badge-info', icon: <Package className="w-4 h-4" /> },
      shipped: { color: 'badge-primary', icon: <Truck className="w-4 h-4" /> },
      delivered: { color: 'badge-success', icon: <CheckCircle className="w-4 h-4" /> },
      cancelled: { color: 'badge-error', icon: <XCircle className="w-4 h-4" /> },
    }

    const badge = badges[status] || badges.pending

    return (
      <div className={`badge ${badge.color} gap-2`}>
        {badge.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'badge-warning',
      paid: 'badge-success',
      failed: 'badge-error',
      refunded: 'badge-info',
    }

    return (
      <span className={`badge ${colors[status] || 'badge-neutral'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

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
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/account/orders" className="btn btn-ghost btn-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order #{order.orderNumber}</h1>
              <p className="text-sm opacity-70">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex gap-2">{getStatusBadge(order.status)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Order Items
                </h2>

                <div className="space-y-4">
                  {(order.items as OrderItem[]).map((item, index: number) => {
                    const product = typeof item.product === 'object' ? item.product : null
                    const imageUrl =
                      typeof product?.images?.[0] === 'object'
                        ? product.images[0]?.url
                        : product?.images?.[0]

                    return (
                      <div key={index} className="flex gap-4 p-4 bg-base-100 rounded-lg">
                        <div className="avatar">
                          <div className="w-20 h-20 rounded-lg">
                            <Image
                              src={imageUrl || PLACEHOLDER_IMAGE}
                              alt={product?.name || 'Product'}
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{product?.name || 'Product'}</div>
                          <div className="text-sm opacity-70 mt-1">Quantity: {item.quantity}</div>
                          <div className="text-sm opacity-70">
                            Price: {currency} {item.price?.toFixed(2) || '0.00'}
                          </div>
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

                {/* Order Summary */}
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

            {/* Shipping Address */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Shipping Address
                </h2>

                <div className="space-y-1">
                  <div className="font-semibold">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </div>
                  {order.shippingAddress.state && <div>{order.shippingAddress.state}</div>}
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.nearbyLandmark && (
                    <div className="mt-2">
                      <span className="opacity-70">Nearby Landmark:</span>{' '}
                      {order.shippingAddress.nearbyLandmark}
                    </div>
                  )}
                  {order.shippingAddress.detailedDirections && (
                    <div className="mt-2">
                      <span className="opacity-70">Directions:</span>{' '}
                      {order.shippingAddress.detailedDirections}
                    </div>
                  )}
                  {order.shippingAddress.phone && (
                    <div className="mt-2">
                      <span className="opacity-70">Phone:</span> {order.shippingAddress.phone}
                    </div>
                  )}
                  {order.shippingAddress.coordinates?.latitude &&
                    order.shippingAddress.coordinates?.longitude && (
                      <div className="mt-2 text-xs opacity-70">
                        <span>Coordinates:</span> {order.shippingAddress.coordinates.latitude},{' '}
                        {order.shippingAddress.coordinates.longitude}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Status */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Order Status</h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm opacity-70 mb-1">Order Status</div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div>
                    <div className="text-sm opacity-70 mb-1">Payment Status</div>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>

                  {order.trackingNumber && (
                    <div>
                      <div className="text-sm opacity-70 mb-1">Tracking Number</div>
                      <div className="font-mono text-sm bg-base-100 p-2 rounded">
                        {order.trackingNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment
                </h2>

                <div className="space-y-2">
                  <div>
                    <div className="text-sm opacity-70">Payment Method</div>
                    <div className="font-medium">
                      {order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod) : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm opacity-70">Payment Status</div>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">Order Timeline</h2>

                <ul className="timeline timeline-vertical timeline-compact">
                  <li>
                    <div className="timeline-start text-xs opacity-70">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div className="timeline-middle">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="timeline-end timeline-box">Order Placed</div>
                    <hr className="bg-success" />
                  </li>

                  {order.status !== 'pending' && (
                    <li>
                      <hr className={order.status === 'cancelled' ? 'bg-error' : 'bg-success'} />
                      <div className="timeline-middle">
                        {order.status === 'cancelled' ? (
                          <XCircle className="w-4 h-4 text-error" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                      </div>
                      <div className="timeline-end timeline-box">
                        {order.status === 'cancelled'
                          ? 'Order Cancelled'
                          : order.status === 'processing'
                            ? 'Processing'
                            : order.status === 'shipped'
                              ? 'Shipped'
                              : 'Delivered'}
                      </div>
                      <hr
                        className={
                          order.status === 'cancelled'
                            ? ''
                            : order.status === 'delivered'
                              ? 'bg-success'
                              : ''
                        }
                      />
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Help Section */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-2">Need Help?</h2>
                <p className="text-sm opacity-70 mb-4">
                  Have questions about your order? We&apos;re here to help!
                </p>
                <Link href="/contact" className="btn btn-outline btn-sm">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
