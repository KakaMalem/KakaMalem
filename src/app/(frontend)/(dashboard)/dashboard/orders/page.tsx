import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload, Where } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Order, Product, User, Storefront } from '@/payload-types'

interface OrdersPageProps {
  searchParams: Promise<{ page?: string; status?: string; payment?: string }>
}

export default async function DashboardOrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/orders',
  })
  const payload = await getPayload({ config })

  const page = parseInt(params.page || '1')
  const statusFilter = params.status || 'all'
  const paymentFilter = params.payment || 'all'
  const limit = 20

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

  // Build where clause for orders - check multiple paths for seller ownership
  // This covers direct seller, storefront ownership, and auto-populated productSeller
  const baseWhere: Where = hasStorefront
    ? {
        or: [
          { 'items.productSeller': { equals: user.id } },
          { 'items.product.seller': { equals: user.id } },
          { 'items.product.stores': { contains: storefront.id } },
        ],
      }
    : {
        or: [
          { 'items.productSeller': { equals: user.id } },
          { 'items.product.seller': { equals: user.id } },
        ],
      }

  // Build filter conditions
  const filterConditions: Where[] = [baseWhere]

  if (statusFilter !== 'all') {
    filterConditions.push({ status: { equals: statusFilter } })
  }

  if (paymentFilter !== 'all') {
    filterConditions.push({ paymentStatus: { equals: paymentFilter } })
  }

  const whereClause: Where = filterConditions.length > 1 ? { and: filterConditions } : baseWhere

  // Get orders - access control will filter to seller's orders
  const orders = await payload.find({
    collection: 'orders',
    where: whereClause,
    limit,
    page,
    sort: '-createdAt',
    depth: 2,
  })

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

  // Helper to format date (using Gregorian calendar with Persian numerals)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fa-IR-u-ca-gregory', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  // Helper to get seller's items from order
  // Check multiple paths: productSeller, product.seller, product.stores
  const getSellerItems = (order: Order) => {
    if (!order.items) return []
    return order.items.filter((item) => {
      // Check productSeller field
      const productSellerId =
        typeof item.productSeller === 'object'
          ? (item.productSeller as User)?.id
          : item.productSeller
      if (productSellerId === user.id) return true

      // Check product.seller
      const product = item.product as Product | undefined
      if (product) {
        const directSellerId =
          typeof product.seller === 'object' ? (product.seller as User)?.id : product.seller
        if (directSellerId === user.id) return true

        // Check product.stores - if any store matches the seller's storefront
        if (hasStorefront && product.stores && Array.isArray(product.stores)) {
          for (const store of product.stores) {
            if (typeof store === 'object' && store !== null) {
              const storeObj = store as Storefront
              if (storeObj.id === storefront.id) return true
              const storeSellerId =
                typeof storeObj.seller === 'object'
                  ? (storeObj.seller as User)?.id
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
  }

  // Calculate seller's portion of order
  const getSellerTotal = (order: Order) => {
    const sellerItems = getSellerItems(order)
    return sellerItems.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  // Get product names for display
  const getItemNames = (order: Order) => {
    const sellerItems = getSellerItems(order)
    return sellerItems
      .map((item) => {
        const product = item.product as Product
        return product?.name || 'محصول'
      })
      .slice(0, 2)
      .join('، ')
  }

  const getItemCount = (order: Order) => {
    return getSellerItems(order).length
  }

  // Status filter tabs
  const statusTabs = [
    { value: 'all', label: 'همه', icon: null },
    { value: 'pending', label: 'در انتظار', icon: <Clock className="w-3.5 h-3.5" /> },
    { value: 'processing', label: 'در حال پردازش', icon: <Package className="w-3.5 h-3.5" /> },
    { value: 'shipped', label: 'ارسال شده', icon: <Truck className="w-3.5 h-3.5" /> },
    { value: 'delivered', label: 'تحویل شده', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { value: 'cancelled', label: 'لغو شده', icon: <XCircle className="w-3.5 h-3.5" /> },
  ]

  // Payment status filter tabs
  const paymentTabs = [
    { value: 'all', label: 'همه' },
    { value: 'pending', label: 'در انتظار پرداخت' },
    { value: 'paid', label: 'پرداخت شده' },
    { value: 'failed', label: 'ناموفق' },
    { value: 'refunded', label: 'بازگشت داده شده' },
  ]

  // Helper to build filter URL
  const buildFilterUrl = (newStatus?: string, newPayment?: string, newPage?: number) => {
    const status = newStatus ?? statusFilter
    const payment = newPayment ?? paymentFilter
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    if (payment !== 'all') params.set('payment', payment)
    if (newPage && newPage > 1) params.set('page', String(newPage))
    const queryString = params.toString()
    return `/dashboard/orders${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">سفارشات</h1>
          <p className="text-base-content/60 mt-1">
            مدیریت سفارشات محصولات شما ({orders.totalDocs} سفارش)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-200">
        <div className="card-body p-4 space-y-4">
          {/* Order Status Filter */}
          <div>
            <h4 className="text-sm font-medium text-base-content/70 mb-2">وضعیت سفارش</h4>
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={buildFilterUrl(tab.value, undefined)}
                  className={`btn btn-sm gap-1.5 ${
                    statusFilter === tab.value
                      ? 'btn-primary'
                      : 'btn-ghost bg-base-100 hover:bg-base-300'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div>
            <h4 className="text-sm font-medium text-base-content/70 mb-2">وضعیت پرداخت</h4>
            <div className="flex flex-wrap gap-2">
              {paymentTabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={buildFilterUrl(undefined, tab.value)}
                  className={`btn btn-sm ${
                    paymentFilter === tab.value
                      ? 'btn-primary'
                      : 'btn-ghost bg-base-100 hover:bg-base-300'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== 'all' || paymentFilter !== 'all') && (
            <div className="flex items-center gap-2 pt-2 border-t border-base-300">
              <span className="text-sm text-base-content/60">فیلترهای فعال:</span>
              {statusFilter !== 'all' && (
                <span className="badge badge-primary badge-sm gap-1">
                  {statusTabs.find((t) => t.value === statusFilter)?.label}
                </span>
              )}
              {paymentFilter !== 'all' && (
                <span className="badge badge-secondary badge-sm gap-1">
                  {paymentTabs.find((t) => t.value === paymentFilter)?.label}
                </span>
              )}
              <Link href="/dashboard/orders" className="btn btn-ghost btn-xs">
                پاک کردن فیلترها
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      {orders.docs.length > 0 ? (
        <div className="card bg-base-200">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>شماره سفارش</th>
                  <th>محصولات</th>
                  <th>مبلغ شما</th>
                  <th>وضعیت</th>
                  <th>پرداخت</th>
                  <th>تاریخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.docs.map((order) => {
                  const status = statusConfig[order.status || 'pending']
                  const paymentStatus = paymentStatusConfig[order.paymentStatus || 'pending']
                  const sellerTotal = getSellerTotal(order)
                  const itemNames = getItemNames(order)
                  const itemCount = getItemCount(order)

                  return (
                    <tr key={order.id} className="hover">
                      <td>
                        <span className="font-mono text-sm">{order.orderNumber}</span>
                      </td>
                      <td>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{itemNames}</p>
                          {itemCount > 2 && (
                            <p className="text-xs text-base-content/60">
                              و {itemCount - 2} محصول دیگر
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-medium">{sellerTotal.toLocaleString()} ؋</span>
                      </td>
                      <td>
                        <span className={`badge badge-sm gap-1 whitespace-nowrap ${status.class}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-sm whitespace-nowrap ${paymentStatus.class}`}>
                          {paymentStatus.label}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-base-content/70">
                          {formatDate(order.createdAt)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="btn btn-ghost btn-sm btn-square"
                          title="مشاهده جزئیات"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {orders.totalPages > 1 && (
            <div className="card-body pt-0">
              <div className="flex justify-center items-center gap-2">
                {page > 1 && (
                  <Link
                    href={buildFilterUrl(undefined, undefined, page - 1)}
                    className="btn btn-ghost btn-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                    قبلی
                  </Link>
                )}
                <span className="text-sm text-base-content/60">
                  صفحه {page} از {orders.totalPages}
                </span>
                {page < orders.totalPages && (
                  <Link
                    href={buildFilterUrl(undefined, undefined, page + 1)}
                    className="btn btn-ghost btn-sm"
                  >
                    بعدی
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-16">
            <ShoppingBag className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-xl font-bold">هنوز سفارشی ندارید</h3>
            <p className="text-base-content/60 max-w-md">
              وقتی مشتریان از محصولات شما خرید کنند، سفارشات در اینجا نمایش داده می‌شوند.
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-bold mb-2">راهنمای سفارشات</h3>
          <ul className="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>فقط سفارشاتی که شامل محصولات شما هستند نمایش داده می‌شوند</li>
            <li>
              می‌توانید وضعیت سفارش را به «در حال پردازش»، «ارسال شده» یا «تحویل شده» تغییر دهید
            </li>
            <li>مبلغ نمایش داده شده، سهم شما از کل سفارش است</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
