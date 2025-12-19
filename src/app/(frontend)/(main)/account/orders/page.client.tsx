'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  ChevronLeft,
  Hash,
  Box,
} from 'lucide-react'
import type { Order, Product } from '@/payload-types'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'
import { getProductImageUrl } from '@/utilities/ui'

interface OrderItem {
  product: string | Product
  quantity: number
  price?: number
  total?: number
}

interface OrdersClientProps {
  orders: Order[]
}

// Status configuration with background colors for cards
const ORDER_STATUS_CONFIG: Record<
  string,
  {
    badge: string
    label: string
    icon: React.ReactNode
    color: string
    bgAccent: string
    borderColor: string
  }
> = {
  delivered: {
    badge: 'badge-success',
    label: 'تحویل شده',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-success',
    bgAccent: 'bg-success/10',
    borderColor: 'border-r-success',
  },
  shipped: {
    badge: 'badge-info',
    label: 'ارسال شده',
    icon: <Truck className="w-4 h-4" />,
    color: 'text-info',
    bgAccent: 'bg-info/10',
    borderColor: 'border-r-info',
  },
  processing: {
    badge: 'badge-warning',
    label: 'در حال پردازش',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-warning',
    bgAccent: 'bg-warning/10',
    borderColor: 'border-r-warning',
  },
  cancelled: {
    badge: 'badge-error',
    label: 'لغو شده',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-error',
    bgAccent: 'bg-error/10',
    borderColor: 'border-r-error',
  },
  pending: {
    badge: 'badge-ghost',
    label: 'در انتظار',
    icon: <Package className="w-4 h-4" />,
    color: 'text-base-content/60',
    bgAccent: 'bg-base-300/50',
    borderColor: 'border-r-base-300',
  },
}

export default function OrdersClient({ orders }: OrdersClientProps) {
  const getStatusConfig = (status: string) => {
    return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending
  }

  const getCurrencySymbol = (currency?: string | null) => {
    return currency === 'USD' ? '$' : '؋'
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'حساب کاربری', href: '/account' },
            { label: 'سفارشات', active: true },
          ]}
        />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">تاریخچه سفارشات</h2>
            <p className="text-base-content/70 mt-0.5">مدیریت و پیگیری سفارشات شما</p>
          </div>
        </div>

        <div className="card bg-base-200 shadow-sm">
          <div className="card-body text-center py-16">
            <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-base-content/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">هنوز سفارشی ندارید</h3>
            <p className="text-base-content/70 mb-6 max-w-md mx-auto">
              شما هنوز هیچ سفارشی ثبت نکرده‌اید. برای مشاهده تاریخچه سفارشات، خرید خود را شروع کنید.
            </p>
            <Link href="/" className="btn btn-primary gap-2 mx-auto">
              <ShoppingBag className="w-4 h-4" />
              شروع خرید
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'حساب کاربری', href: '/account' },
          { label: 'سفارشات', active: true },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">تاریخچه سفارشات</h2>
            <p className="text-base-content/70 mt-0.5">{orders.length} سفارش در مجموع</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt).toLocaleDateString('fa-IR-u-ca-gregory', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
          const statusConfig = getStatusConfig(order.status || 'pending')
          const itemCount = order.items?.length || 0
          const items = (order.items || []) as OrderItem[]

          // Get first 4 product images for preview
          const productImages = items.slice(0, 4).map((item) => {
            const product = typeof item.product === 'object' ? item.product : null
            return {
              url: getProductImageUrl(product),
              name: product?.name || 'محصول',
            }
          })

          return (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className={`block card bg-base-100 border-r-4 ${statusConfig.borderColor} shadow-sm hover:shadow-lg transition-all duration-200 group overflow-hidden`}
            >
              <div className="card-body p-0">
                {/* Top Section - Order Header */}
                <div className={`${statusConfig.bgAccent} px-4 py-3 border-b border-base-200`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${statusConfig.bgAccent} flex items-center justify-center ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-base">
                            سفارش #{order.orderNumber || order.id.slice(-8)}
                          </span>
                          <span
                            className={`badge badge-sm ${statusConfig.badge} whitespace-nowrap flex-shrink-0`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-base-content/60 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {orderDate}
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Product Images Preview */}
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-3 space-x-reverse">
                        {productImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="w-14 h-14 rounded-xl border-2 border-base-100 overflow-hidden bg-base-200 shadow-sm"
                            title={img.name}
                          >
                            <Image
                              src={img.url}
                              alt={img.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {itemCount > 4 && (
                          <div className="w-14 h-14 rounded-xl border-2 border-base-100 bg-base-300 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-medium text-base-content/70">
                              +{itemCount - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center gap-1.5 text-base-content/70">
                          <Box className="w-4 h-4" />
                          <span>{itemCount} قلم</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-base-content/70">
                          <Hash className="w-4 h-4" />
                          <span className="font-mono text-xs">
                            {order.orderNumber || order.id.slice(-8)}
                          </span>
                        </div>
                      </div>

                      {/* Product Names Preview */}
                      <p className="text-sm text-base-content/60 mt-2 line-clamp-1">
                        {items
                          .slice(0, 3)
                          .map((item) => {
                            const product = typeof item.product === 'object' ? item.product : null
                            return product?.name || 'محصول'
                          })
                          .join('، ')}
                        {itemCount > 3 && ` و ${itemCount - 3} مورد دیگر`}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:gap-1 pt-3 md:pt-0 border-t md:border-t-0 border-base-200">
                      <div className="text-left md:text-right">
                        <div className="text-xs text-base-content/50">مبلغ کل</div>
                        <div className="text-xl font-bold text-primary">
                          {getCurrencySymbol(order.currency)}{' '}
                          {typeof order.total === 'number' ? order.total.toLocaleString() : '0'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
                        <span>مشاهده جزئیات</span>
                        <ChevronLeft className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
