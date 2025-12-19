'use client'

import React from 'react'
import Link from 'next/link'
import { Package, MapPin, CreditCard, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import type { Order, User, Product, ProductVariant, Media } from '@/payload-types'
import Image from 'next/image'
import { Breadcrumb, type BreadcrumbItem } from '@/app/(frontend)/components/Breadcrumb'
import { PLACEHOLDER_IMAGE } from '@/utilities/ui'

/**
 * Extract URL from a Media object or string
 */
const extractMediaUrl = (mediaItem: unknown): string | null => {
  if (typeof mediaItem === 'string') return mediaItem

  if (typeof mediaItem === 'object' && mediaItem !== null) {
    const media = mediaItem as Media | { url?: string | null }

    if ('url' in media && typeof media.url === 'string' && media.url) {
      return media.url
    }

    const possibleUrl = (media as { url?: string | null }).url
    if (typeof possibleUrl === 'string' && possibleUrl) {
      return possibleUrl
    }
  }

  return null
}

interface OrderItem {
  product: string | Product
  variant?: string | ProductVariant | null
  quantity: number
  price?: number
  total?: number
}

interface OrderDetailsClientProps {
  order: Order
  user: User
}

export default function OrderDetailsClient({ order, user }: OrderDetailsClientProps) {
  const currencyCode = order.currency || user.preferences?.currency || 'AFN'
  const currency = currencyCode === 'USD' ? '$' : '؋'

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'حساب کاربری',
      href: '/account',
    },
    {
      label: 'سفارشات',
      href: '/account/orders',
    },
    {
      label: `سفارش #${order.orderNumber}`,
      active: true,
    },
  ]

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'badge-warning', icon: <Clock className="w-4 h-4" />, label: 'در انتظار' },
      processing: {
        color: 'badge-info',
        icon: <Package className="w-4 h-4" />,
        label: 'در حال پردازش',
      },
      shipped: { color: 'badge-primary', icon: <Truck className="w-4 h-4" />, label: 'ارسال شده' },
      delivered: {
        color: 'badge-success',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'تحویل داده شده',
      },
      cancelled: { color: 'badge-error', icon: <XCircle className="w-4 h-4" />, label: 'لغو شده' },
    }

    const badge = badges[status] || badges.pending

    return (
      <div className={`badge ${badge.color} gap-2 whitespace-nowrap flex-shrink-0`}>
        {badge.icon}
        {badge.label}
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

    const labels: Record<string, string> = {
      pending: 'در انتظار',
      paid: 'پرداخت شده',
      failed: 'ناموفق',
      refunded: 'بازگشت داده شده',
    }

    return (
      <span
        className={`badge ${colors[status] || 'badge-neutral'} whitespace-nowrap flex-shrink-0`}
      >
        {labels[status] || status}
      </span>
    )
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: 'پرداخت هنگام تحویل',
      bank_transfer: 'انتقال بانکی',
      credit_card: 'کارت اعتباری',
    }
    return labels[method] || method
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">سفارش #{order.orderNumber}</h1>
              <p className="text-sm opacity-70">
                ثبت شده در{' '}
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
                  اقلام سفارش
                </h2>

                <div className="space-y-4">
                  {(order.items as OrderItem[]).map((item, index: number) => {
                    const product = typeof item.product === 'object' ? item.product : null
                    const variant = typeof item.variant === 'object' ? item.variant : null

                    if (!product) return null

                    // Get the appropriate image using proper prioritization
                    const getImageUrl = (): string => {
                      // Priority 1: Variant images
                      if (
                        variant?.images &&
                        Array.isArray(variant.images) &&
                        variant.images.length > 0
                      ) {
                        const url = extractMediaUrl(variant.images[0])
                        if (url) return url
                      }

                      // Priority 2: Product main images
                      if (
                        product.images &&
                        Array.isArray(product.images) &&
                        product.images.length > 0
                      ) {
                        const url = extractMediaUrl(product.images[0])
                        if (url) return url
                      }

                      // Priority 3: Placeholder
                      return PLACEHOLDER_IMAGE
                    }

                    const imageUrl = getImageUrl()

                    // Get variant label for display
                    const variantLabel = variant?.options
                      ?.map((opt) => `${opt.name}: ${opt.value}`)
                      .join(', ')

                    return (
                      <div key={index} className="flex gap-4 p-4 bg-base-100 rounded-lg">
                        <div className="avatar">
                          <div className="w-20 h-20 rounded-lg">
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{product.name}</div>
                          {variantLabel && (
                            <div className="text-xs text-base-content/60 mt-0.5">
                              {variantLabel}
                            </div>
                          )}
                          <div className="text-sm opacity-70 mt-1">تعداد: {item.quantity}</div>
                          <div className="text-sm opacity-70">
                            قیمت: {currency} {item.price?.toFixed(2) || '0.00'}
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
                    <span className="opacity-70">جمع جزء</span>
                    <span className="font-medium">
                      {currency} {order.subtotal?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">هزینه ارسال</span>
                    <span className="font-medium">
                      {order.shipping === 0 ? (
                        <span className="text-success">رایگان</span>
                      ) : (
                        `${currency} ${order.shipping?.toFixed(2) || '0.00'}`
                      )}
                    </span>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>جمع کل</span>
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
                  آدرس ارسال
                </h2>

                <div className="space-y-1">
                  <div className="font-semibold">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </div>
                  {order.shippingAddress.state && <div>{order.shippingAddress.state}</div>}
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.nearbyLandmark && (
                    <div className="mt-2">
                      <span className="opacity-70">نشانی اطراف:</span>{' '}
                      {order.shippingAddress.nearbyLandmark}
                    </div>
                  )}
                  {order.shippingAddress.detailedDirections && (
                    <div className="mt-2">
                      <span className="opacity-70">راهنمای مسیر:</span>{' '}
                      {order.shippingAddress.detailedDirections}
                    </div>
                  )}
                  {order.shippingAddress.phone && (
                    <div className="mt-2">
                      <span className="opacity-70">شماره تماس:</span>
                      <span dir="ltr">{order.shippingAddress.phone}</span>
                    </div>
                  )}
                  {order.shippingAddress.coordinates?.latitude &&
                    order.shippingAddress.coordinates?.longitude && (
                      <div className="mt-2 text-xs opacity-70">
                        <span>مختصات:</span> {order.shippingAddress.coordinates.latitude},{' '}
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
                <h2 className="card-title text-lg mb-4">وضعیت سفارش</h2>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm opacity-70 mb-1">وضعیت سفارش</div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div>
                    <div className="text-sm opacity-70 mb-1">وضعیت پرداخت</div>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>

                  {order.trackingNumber && (
                    <div>
                      <div className="text-sm opacity-70 mb-1">کد رهگیری</div>
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
                  پرداخت
                </h2>

                <div className="space-y-2">
                  <div>
                    <div className="text-sm opacity-70">روش پرداخت</div>
                    <div className="font-medium">
                      {order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod) : 'ندارد'}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm opacity-70">وضعیت پرداخت</div>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">زمان‌بندی سفارش</h2>

                <ul className="timeline timeline-vertical timeline-compact">
                  <li>
                    <div className="timeline-start text-xs opacity-70">
                      {new Date(order.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="timeline-middle">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <div className="timeline-end timeline-box">سفارش ثبت شد</div>
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
                          ? 'سفارش لغو شد'
                          : order.status === 'processing'
                            ? 'در حال پردازش'
                            : order.status === 'shipped'
                              ? 'ارسال شده'
                              : 'تحویل داده شده'}
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
                <h2 className="card-title text-lg mb-2">نیاز به کمک دارید؟</h2>
                <p className="text-sm opacity-70 mb-4">
                  سوالی درباره سفارش خود دارید؟ ما اینجا هستیم تا کمک کنیم!
                </p>
                <Link href="/contact" className="btn btn-outline btn-sm">
                  تماس با پشتیبانی
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
