import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  FileText,
} from 'lucide-react'
import type {
  Order,
  Product,
  User as UserType,
  Media,
  ProductVariant,
  Storefront,
} from '@/payload-types'
import OrderStatusUpdate from './OrderStatusUpdate'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const { user } = await getMeUser({
    nullUserRedirect: `/auth/login?redirect=/dashboard/orders/${id}`,
  })
  const payload = await getPayload({ config })

  // Get seller's storefront to check for storefront-based ownership
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    limit: 1,
  })

  const hasStorefront = storefronts.docs.length > 0
  const storefront = storefronts.docs[0]

  // Get the order
  let order: Order | null = null
  try {
    order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 3,
    })
  } catch {
    notFound()
  }

  if (!order) {
    notFound()
  }

  // Check if seller owns any products in this order
  // Check multiple paths: productSeller, product.seller, product.stores
  const sellerItems = order.items?.filter((item) => {
    // Check productSeller field
    const productSellerId =
      typeof item.productSeller === 'object'
        ? (item.productSeller as UserType)?.id
        : item.productSeller
    if (productSellerId === user.id) return true

    // Check product.seller
    const product = item.product as Product | undefined
    if (product) {
      const directSellerId =
        typeof product.seller === 'object' ? (product.seller as UserType)?.id : product.seller
      if (directSellerId === user.id) return true

      // Check product.stores - if any store matches the seller's storefront
      if (hasStorefront && product.stores && Array.isArray(product.stores)) {
        for (const store of product.stores) {
          if (typeof store === 'object' && store !== null) {
            const storeObj = store as Storefront
            if (storeObj.id === storefront.id) return true
            const storeSellerId =
              typeof storeObj.seller === 'object'
                ? (storeObj.seller as UserType)?.id
                : storeObj.seller
            if (storeSellerId === user.id) return true
          } else if (store === storefront.id) {
            return true
          }
        }
      }
    }

    return false
  })

  if (!sellerItems || sellerItems.length === 0) {
    // Check if user is admin
    const isAdmin =
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer')
    if (!isAdmin) {
      notFound()
    }
  }

  // Status configuration
  const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    pending: {
      label: 'در انتظار',
      class: 'badge-warning',
      icon: <Clock className="w-4 h-4" />,
    },
    processing: {
      label: 'در حال پردازش',
      class: 'badge-info',
      icon: <Package className="w-4 h-4" />,
    },
    shipped: {
      label: 'ارسال شده',
      class: 'badge-primary',
      icon: <Truck className="w-4 h-4" />,
    },
    delivered: {
      label: 'تحویل شده',
      class: 'badge-success',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    cancelled: {
      label: 'لغو شده',
      class: 'badge-error',
      icon: <XCircle className="w-4 h-4" />,
    },
  }

  const paymentStatusConfig: Record<string, { label: string; class: string }> = {
    pending: { label: 'در انتظار پرداخت', class: 'badge-warning' },
    paid: { label: 'پرداخت شده', class: 'badge-success' },
    failed: { label: 'ناموفق', class: 'badge-error' },
    refunded: { label: 'بازگشت داده شده', class: 'badge-secondary' },
  }

  const paymentMethodLabels: Record<string, string> = {
    cod: 'پرداخت در محل',
    bank_transfer: 'انتقال بانکی',
    credit_card: 'کارت اعتباری',
  }

  // Helper to format date (using Gregorian calendar with Persian numerals)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Helper to get product image
  const getProductImage = (item: Order['items'][0]): string | null => {
    const product = item.product as Product
    if (!product?.images) return null
    const images = Array.isArray(product.images) ? product.images : [product.images]
    const firstImage = images[0]
    if (typeof firstImage === 'object' && firstImage !== null) {
      return (firstImage as Media).url || null
    }
    return null
  }

  // Helper to format variant details
  const getVariantLabel = (item: Order['items'][0]): string | null => {
    const variant = item.variant as ProductVariant
    if (!variant?.options) return null
    return variant.options.map((opt) => `${opt.name}: ${opt.value}`).join(' | ')
  }

  // Calculate seller's portion
  const sellerTotal = sellerItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0

  const status = statusConfig[order.status || 'pending']
  const paymentStatus = paymentStatusConfig[order.paymentStatus || 'pending']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="btn btn-ghost btn-sm btn-square">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">سفارش {order.orderNumber}</h1>
            <p className="text-base-content/60 mt-1">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge gap-1 ${status.class}`}>
            {status.icon}
            {status.label}
          </span>
          <span className={`badge ${paymentStatus.class}`}>{paymentStatus.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Items */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">محصولات شما در این سفارش</h3>

              <div className="space-y-4">
                {sellerItems?.map((item, index) => {
                  const product = item.product as Product
                  const imageUrl = getProductImage(item)
                  const variantLabel = getVariantLabel(item)

                  return (
                    <div key={index} className="flex items-start gap-4 p-4 bg-base-300 rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-base-100 flex-shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product?.name || 'Product'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-base-content/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{product?.name || 'محصول'}</p>
                        {variantLabel && (
                          <p className="text-sm text-base-content/60">{variantLabel}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>تعداد: {item.quantity}</span>
                          <span>قیمت واحد: {item.price?.toLocaleString()} ؋</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{item.total?.toLocaleString()} ؋</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="divider"></div>

              <div className="flex justify-between items-center">
                <span className="font-medium">جمع سهم شما:</span>
                <span className="font-bold text-xl">{sellerTotal.toLocaleString()} ؋</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.customerNote && (
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-lg gap-2">
                  <FileText className="w-5 h-5" />
                  یادداشت مشتری
                </h3>
                <p className="text-base-content/80">{order.customerNote}</p>
              </div>
            </div>
          )}

          {/* Update Status */}
          <OrderStatusUpdate
            orderId={order.id}
            currentStatus={order.status || 'pending'}
            currentPaymentStatus={order.paymentStatus || 'pending'}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg">خلاصه سفارش</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-content/60">شماره سفارش</span>
                  <span className="font-mono">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">تاریخ ثبت</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">روش پرداخت</span>
                  <span>{paymentMethodLabels[order.paymentMethod || 'cod']}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">تعداد اقلام شما</span>
                  <span>{sellerItems?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg gap-2">
                <MapPin className="w-5 h-5" />
                اطلاعات ارسال
              </h3>

              <div className="space-y-3 text-sm">
                {/* Recipient Name */}
                {(order.shippingAddress?.firstName || order.shippingAddress?.lastName) && (
                  <div className="flex items-start gap-2">
                    <span className="text-base-content/60 min-w-20">گیرنده:</span>
                    <span className="font-medium">
                      {[order.shippingAddress.firstName, order.shippingAddress.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  </div>
                )}

                {/* Phone */}
                {order.shippingAddress?.phone && (
                  <div className="flex items-start gap-2">
                    <span className="text-base-content/60 min-w-20">تلفن:</span>
                    <span dir="ltr" className="font-mono">
                      {order.shippingAddress.phone}
                    </span>
                  </div>
                )}

                {/* Location */}
                {(order.shippingAddress?.state || order.shippingAddress?.country) && (
                  <div className="flex items-start gap-2">
                    <span className="text-base-content/60 min-w-20">موقعیت:</span>
                    <span>
                      {[order.shippingAddress.state, order.shippingAddress.country]
                        .filter(Boolean)
                        .join('، ')}
                    </span>
                  </div>
                )}

                {/* Nearby Landmark */}
                {order.shippingAddress?.nearbyLandmark && (
                  <div className="flex items-start gap-2">
                    <span className="text-base-content/60 min-w-20">نشانی:</span>
                    <span>{order.shippingAddress.nearbyLandmark}</span>
                  </div>
                )}

                {/* Detailed Directions */}
                {order.shippingAddress?.detailedDirections && (
                  <div className="flex items-start gap-2">
                    <span className="text-base-content/60 min-w-20">توضیحات:</span>
                    <span>{order.shippingAddress.detailedDirections}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline would go here in a future update */}
        </div>
      </div>
    </div>
  )
}
