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
  Calendar,
} from 'lucide-react'
import type { Order, Product, ProductVariant, Media } from '@/payload-types'
import confetti from 'canvas-confetti'
import Image from 'next/image'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'
import { PLACEHOLDER_IMAGE } from '@/utilities/ui'

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

export default function OrderConfirmationClient({ order }: OrderConfirmationClientProps) {
  const [confettiShown, setConfettiShown] = React.useState(false)
  const currency = order.currency || 'AFN'
  const isGuest = !order.customer

  // Show confetti on mount (only once per session for this order)
  React.useEffect(() => {
    const confettiKey = `confetti-${order.id}`
    const hasShown = sessionStorage.getItem(confettiKey)

    if (!confettiShown && !hasShown) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
      setConfettiShown(true)
      sessionStorage.setItem(confettiKey, 'true')
    }
  }, [confettiShown, order.id])

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: 'پرداخت هنگام تحویل',
      bank_transfer: 'انتقال بانکی',
      credit_card: 'کارت اعتباری',
    }
    return labels[method] || method
  }

  const getPaymentStatusBadge = (status: string | null | undefined) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      pending: { label: 'در انتظار پرداخت', class: 'badge-warning' },
      paid: { label: 'پرداخت شده', class: 'badge-success' },
      failed: { label: 'ناموفق', class: 'badge-error' },
      refunded: { label: 'بازگشت وجه', class: 'badge-info' },
    }
    const config = statusConfig[status || 'pending'] || statusConfig.pending
    return <span className={`badge badge-sm ${config.class}`}>{config.label}</span>
  }

  const getOrderStatusBadge = (status: string | null | undefined) => {
    const statusConfig: Record<string, { label: string; class: string }> = {
      pending: { label: 'در انتظار بررسی', class: 'badge-warning' },
      processing: { label: 'در حال پروسس', class: 'badge-info' },
      shipped: { label: 'ارسال شده', class: 'badge-primary' },
      delivered: { label: 'تحویل داده شده', class: 'badge-success' },
      cancelled: { label: 'لغو شده', class: 'badge-error' },
    }
    const config = statusConfig[status || 'pending'] || statusConfig.pending
    return <span className={`badge ${config.class}`}>{config.label}</span>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '0'
    const formatted = amount.toLocaleString()
    return currency === 'AFN' ? `${formatted} ؋` : `$${formatted}`
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-success/20 to-success/5 border-b border-success/20">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: 'تصفیه حساب', href: '/checkout' },
                { label: 'تأیید سفارش', active: true },
              ]}
            />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success text-success-content rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-3">سفارش شما ثبت شد!</h1>
          <p className="text-lg opacity-80 mb-2">
            از خرید شما متشکریم. سفارش شما دریافت شده و به زودی پروسس خواهد شد.
          </p>

          {/* Order Info Cards */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="bg-base-200 px-6 py-3 rounded-lg">
              <div className="text-sm opacity-70">شماره سفارش</div>
              <div className="text-2xl font-bold text-primary">{order.orderNumber}</div>
            </div>
            <div className="bg-base-200 px-6 py-3 rounded-lg">
              <div className="text-sm opacity-70">وضعیت سفارش</div>
              <div className="mt-1">{getOrderStatusBadge(order.status)}</div>
            </div>
            <div className="bg-base-200 px-6 py-3 rounded-lg">
              <div className="text-sm opacity-70">تاریخ ثبت</div>
              <div className="text-sm font-medium mt-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(order.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Guest Notice */}
        {isGuest && order.guestEmail && (
          <div className="alert alert-info mb-6">
            <Mail className="w-5 h-5" />
            <div>
              <div className="font-semibold">تأیید سفارش ارسال شد!</div>
              <div className="text-sm">
                ایمیل تأیید به <strong>{order.guestEmail}</strong> ارسال شد
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
                مشاهده جزئیات سفارش
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Link>
              <Link href="/" className="btn btn-outline btn-lg gap-2">
                <ShoppingBag className="w-5 h-5" />
                ادامه خرید
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className="btn btn-primary btn-lg gap-2">
                <ShoppingBag className="w-5 h-5" />
                ادامه خرید
              </Link>
              <Link href="/auth/register" className="btn btn-outline btn-lg gap-2">
                ایجاد حساب کاربری
                <ArrowRight className="w-4 h-4 rotate-180" />
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
                خلاصه سفارش
              </h2>

              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {(order.items as OrderItem[]).map((item, index: number) => {
                  const product = typeof item.product === 'object' ? item.product : null
                  const variant = typeof item.variant === 'object' ? item.variant : null

                  if (!product) return null

                  // Get the appropriate image using proper prioritization (matching ReviewStep)
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
                    <div key={index} className="flex gap-3">
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
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="divider"></div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-70">جمع جزء</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">هزینه ارسال</span>
                  <span className="font-medium">
                    {order.shipping === 0 ? (
                      <span className="text-success">رایگان</span>
                    ) : (
                      formatCurrency(order.shipping)
                    )}
                  </span>
                </div>
                <div className="divider my-2"></div>
                <div className="flex justify-between text-xl font-bold">
                  <span>جمع کل</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
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
                  آدرس ارسال
                </h2>

                <div className="space-y-1 text-sm">
                  <div className="font-semibold">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </div>
                  {order.shippingAddress.state && <div>{order.shippingAddress.state}</div>}
                  <div>{order.shippingAddress.country}</div>
                  {order.shippingAddress.phone && (
                    <div className="mt-2">
                      <span className="opacity-70">شماره تماس:</span>
                      <span dir="ltr">{order.shippingAddress.phone}</span>
                    </div>
                  )}

                  {/* Location Details for Delivery */}
                  {(order.shippingAddress.nearbyLandmark ||
                    order.shippingAddress.detailedDirections ||
                    order.shippingAddress.coordinates) && (
                    <>
                      <div className="divider my-2"></div>
                      <div className="text-xs font-semibold text-primary mb-1">
                        دستورالعمل‌های تحویل:
                      </div>
                      {order.shippingAddress.nearbyLandmark && (
                        <div className="flex items-start gap-2 bg-info/10 p-2 rounded">
                          <MapPin className="w-4 h-4 mt-0.5 text-info flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium">نشانی اطراف:</div>
                            <div>{order.shippingAddress.nearbyLandmark}</div>
                          </div>
                        </div>
                      )}
                      {order.shippingAddress.detailedDirections && (
                        <div className="bg-base-100 p-2 rounded">
                          <div className="text-xs font-medium mb-1">راهنمای مسیر:</div>
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
                            باز کردن در گوگل مپ
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
                  روش پرداخت
                </h2>

                <div className="text-sm">
                  <div className="font-medium">
                    {order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod) : 'ندارد'}
                  </div>
                  <div className="opacity-70 mt-2">
                    وضعیت: {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="card bg-primary text-primary-content">
              <div className="card-body">
                <h3 className="card-title text-lg">مراحل بعدی چیست؟</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>ایمیل تأیید برای شما ارسال خواهد شد</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>سفارش شما ظرف ۱-۲ روز کاری پروسس خواهد شد</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>اطلاعات رهگیری پس از ارسال به شما اطلاع داده می‌شود</span>
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
              <h3 className="text-2xl font-bold mb-2">می‌خواهید سفارش خود را پیگیری کنید؟</h3>
              <p className="opacity-80 mb-4">
                حساب کاربری ایجاد کنید تا تاریخچه سفارشات و پیگیری مرسولات خود را در هر زمان مشاهده
                کنید.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/auth/register" className="btn btn-primary gap-2">
                  ایجاد حساب کاربری
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>
                <Link href="/auth/login" className="btn btn-outline">
                  ورود
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
