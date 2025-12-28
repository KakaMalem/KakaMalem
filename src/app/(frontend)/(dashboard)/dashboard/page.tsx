import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload, Where } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import {
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Eye,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'
import type { User, Storefront, Product, Order } from '@/payload-types'

export default async function DashboardPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard',
  })
  const payload = await getPayload({ config })

  // Get seller's storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    limit: 1,
  })

  const hasStorefront = storefronts.docs.length > 0
  const storefront = storefronts.docs[0]

  // Build products where clause - check both seller field and storefront stores
  const productsWhereClause: Where = hasStorefront
    ? {
        or: [{ seller: { equals: user.id } }, { stores: { contains: storefront.id } }],
      }
    : { seller: { equals: user.id } }

  // Build orders where clause - check multiple paths for seller ownership
  const ordersWhereClause: Where = hasStorefront
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

  // Get stats
  const [products, orders] = await Promise.all([
    payload.find({
      collection: 'products',
      where: productsWhereClause,
      limit: 0,
    }),
    payload.find({
      collection: 'orders',
      where: ordersWhereClause,
      limit: 0,
    }),
  ])

  // Helper to check if an order item belongs to the current seller
  // Checks multiple paths: productSeller, product.seller, product.stores
  const isSellerItem = (item: Order['items'][0]) => {
    // Check productSeller field
    const productSellerId =
      typeof item.productSeller === 'object' ? (item.productSeller as User)?.id : item.productSeller
    if (productSellerId === user.id) return true

    // Check product.seller
    const product = item.product as Product | undefined
    if (product) {
      const directSellerId =
        typeof product.seller === 'object' ? (product.seller as User)?.id : product.seller
      if (directSellerId === user.id) return true

      // Check product.stores - if any store belongs to the seller
      if (hasStorefront && product.stores && Array.isArray(product.stores)) {
        for (const store of product.stores) {
          if (typeof store === 'object' && store !== null) {
            const storeObj = store as Storefront
            if (storeObj.id === storefront.id) return true
            const storeSellerId =
              typeof storeObj.seller === 'object' ? (storeObj.seller as User)?.id : storeObj.seller
            if (storeSellerId === user.id) return true
          } else if (store === storefront.id) {
            return true
          }
        }
      }
    }

    return false
  }

  // Calculate revenue from orders
  let totalRevenue = 0
  const recentOrders = await payload.find({
    collection: 'orders',
    where: ordersWhereClause,
    limit: 100,
    depth: 2, // Need depth for accessing product relationships
  })
  totalRevenue = recentOrders.docs.reduce((sum, order) => {
    const sellerItems = order.items?.filter(isSellerItem)
    const orderTotal = sellerItems?.reduce((itemSum, item) => itemSum + (item.total || 0), 0) || 0
    return sum + orderTotal
  }, 0)

  const stats = [
    {
      label: 'محصولات',
      value: products.totalDocs,
      icon: <Package className="w-6 h-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      href: '/dashboard/products',
    },
    {
      label: 'سفارشات',
      value: orders.totalDocs,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-info',
      bgColor: 'bg-info/10',
      href: '/dashboard/orders',
    },
    {
      label: 'درآمد کل',
      value: `${totalRevenue.toLocaleString()} ؋`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      href: '/dashboard/analytics',
    },
  ]

  return (
    <div className="space-y-6">
      {/* No Storefront Warning */}
      {!hasStorefront && (
        <div className="alert alert-warning">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">فروشگاه شما هنوز ایجاد نشده است</h3>
            <p className="text-sm">برای شروع فروش، ابتدا فروشگاه خود را ایجاد کنید.</p>
          </div>
          <Link href="/dashboard/storefront" className="btn btn-warning btn-sm">
            ایجاد فروشگاه
          </Link>
        </div>
      )}

      {/* Storefront Status */}
      {hasStorefront && storefront.status !== 'active' && (
        <div className="alert alert-info">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold">
              وضعیت فروشگاه:{' '}
              {storefront.status === 'pending_review'
                ? 'در انتظار تایید'
                : storefront.status === 'suspended'
                  ? 'تعلیق شده'
                  : 'غیرفعال'}
            </h3>
            <p className="text-sm">
              {storefront.status === 'pending_review'
                ? 'فروشگاه شما در حال بررسی است و به زودی فعال خواهد شد.'
                : 'برای فعال‌سازی مجدد با پشتیبانی تماس بگیرید.'}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card bg-base-200 hover:bg-base-300 transition-colors"
          >
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-base-content/40" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-base-content/60">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">دسترسی سریع</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Link href="/dashboard/products/new" className="btn btn-outline btn-primary">
              <Package className="w-5 h-5" />
              افزودن محصول
            </Link>
            <Link href="/dashboard/orders" className="btn btn-outline btn-info">
              <ShoppingCart className="w-5 h-5" />
              مشاهده سفارشات
            </Link>
            {hasStorefront && (
              <Link
                href={`/store/${storefront.slug}`}
                className="btn btn-outline btn-accent"
                target="_blank"
              >
                <Eye className="w-5 h-5" />
                مشاهده فروشگاه
              </Link>
            )}
            <Link href="/dashboard/analytics" className="btn btn-outline">
              <TrendingUp className="w-5 h-5" />
              گزارش فروش
            </Link>
          </div>
        </div>
      </div>

      {/* Storefront Preview */}
      {hasStorefront && (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title">
                <Store className="w-5 h-5" />
                فروشگاه: {storefront.name}
              </h2>
              <Link href="/dashboard/storefront" className="btn btn-ghost btn-sm">
                ویرایش
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="stat bg-base-100 rounded-xl p-4">
                <div className="stat-title text-xs">بازدیدها</div>
                <div className="stat-value text-lg">{storefront.analytics?.totalViews || 0}</div>
              </div>
              <div className="stat bg-base-100 rounded-xl p-4">
                <div className="stat-title text-xs">بازدید یکتا</div>
                <div className="stat-value text-lg">
                  {storefront.analytics?.uniqueVisitors || 0}
                </div>
              </div>
              <div className="stat bg-base-100 rounded-xl p-4">
                <div className="stat-title text-xs">سفارشات</div>
                <div className="stat-value text-lg">{orders.totalDocs}</div>
              </div>
              <div className="stat bg-base-100 rounded-xl p-4">
                <div className="stat-title text-xs">درآمد</div>
                <div className="stat-value text-lg">{totalRevenue.toLocaleString()} ؋</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
