import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TrendingUp, Eye, ShoppingCart, DollarSign, Users, Package } from 'lucide-react'
import type { Where } from 'payload'
import type { User, Storefront, Product, Order } from '@/payload-types'

export default async function DashboardAnalyticsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/analytics',
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

  // Build products query - check both seller field and storefront stores
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
      limit: 1000, // Get all products to sum analytics
      depth: 0,
    }),
    payload.find({
      collection: 'orders',
      where: ordersWhereClause,
      limit: 100,
      depth: 2, // Need depth for accessing product relationships
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

  // Calculate revenue
  const totalRevenue = orders.docs.reduce((sum, order) => {
    const sellerItems = order.items?.filter(isSellerItem)
    const orderTotal = sellerItems?.reduce((itemSum, item) => itemSum + (item.total || 0), 0) || 0
    return sum + orderTotal
  }, 0)

  // Calculate items sold
  const totalItemsSold = orders.docs.reduce((sum, order) => {
    const sellerItems = order.items?.filter(isSellerItem)
    return sum + (sellerItems?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0)
  }, 0)

  // Calculate product analytics totals
  type ProductWithAnalytics = {
    analytics?: {
      viewCount?: number
      uniqueViewCount?: number
      addToCartCount?: number
      wishlistCount?: number
    }
    totalSold?: number
  }
  const totalProductViews = products.docs.reduce(
    (sum, p) => sum + ((p as ProductWithAnalytics).analytics?.viewCount || 0),
    0,
  )
  const totalAddToCarts = products.docs.reduce(
    (sum, p) => sum + ((p as ProductWithAnalytics).analytics?.addToCartCount || 0),
    0,
  )
  const _totalWishlisted = products.docs.reduce(
    (sum, p) => sum + ((p as ProductWithAnalytics).analytics?.wishlistCount || 0),
    0,
  )
  const totalSold = products.docs.reduce(
    (sum, p) => sum + ((p as ProductWithAnalytics).totalSold || 0),
    0,
  )

  const stats = [
    {
      label: 'کل محصولات',
      value: products.totalDocs,
      icon: <Package className="w-6 h-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'بازدید محصولات',
      value: totalProductViews.toLocaleString(),
      icon: <Eye className="w-6 h-6" />,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'افزودن به سبد',
      value: totalAddToCarts.toLocaleString(),
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'فروخته شده',
      value: totalSold > 0 ? totalSold.toLocaleString() : totalItemsSold.toLocaleString(),
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'سفارشات',
      value: orders.totalDocs,
      icon: <Package className="w-6 h-6" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'درآمد کل',
      value: `${totalRevenue.toLocaleString()} ؋`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ]

  const storefrontStats = hasStorefront
    ? [
        {
          label: 'بازدید فروشگاه',
          value: storefront.analytics?.totalViews || 0,
          icon: <Eye className="w-6 h-6" />,
          color: 'text-info',
          bgColor: 'bg-info/10',
        },
        {
          label: 'بازدیدکنندگان یکتا',
          value: storefront.analytics?.uniqueVisitors || 0,
          icon: <Users className="w-6 h-6" />,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">گزارش و آمار</h1>
        <p className="text-base-content/60 mt-1">آمار فروش و عملکرد فروشگاه شما</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card bg-base-200">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl shrink-0 ${stat.bgColor}`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold truncate">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-base-content/60 truncate">{stat.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Storefront Stats */}
      {hasStorefront && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title mb-4">آمار فروشگاه: {storefront.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              {storefrontStats.map((stat) => (
                <div key={stat.label} className="stat bg-base-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <span className={stat.color}>{stat.icon}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-base-content/60">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title mb-4">آخرین سفارشات</h2>
          {orders.docs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>شماره سفارش</th>
                    <th>تاریخ</th>
                    <th>وضعیت</th>
                    <th>مبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.docs.slice(0, 10).map((order) => {
                    const sellerItems = order.items?.filter(isSellerItem)
                    const orderTotal =
                      sellerItems?.reduce((sum, item) => sum + (item.total || 0), 0) || 0
                    return (
                      <tr key={order.id}>
                        <td className="font-mono text-sm">{order.orderNumber}</td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString('fa-IR-u-ca-gregory')}
                        </td>
                        <td>
                          <span
                            className={`badge badge-sm ${
                              order.status === 'delivered'
                                ? 'badge-success'
                                : order.status === 'processing'
                                  ? 'badge-warning'
                                  : order.status === 'cancelled'
                                    ? 'badge-error'
                                    : 'badge-info'
                            }`}
                          >
                            {order.status === 'pending'
                              ? 'در انتظار'
                              : order.status === 'processing'
                                ? 'در حال پردازش'
                                : order.status === 'shipped'
                                  ? 'ارسال شده'
                                  : order.status === 'delivered'
                                    ? 'تحویل شده'
                                    : order.status === 'cancelled'
                                      ? 'لغو شده'
                                      : order.status}
                          </span>
                        </td>
                        <td>{orderTotal.toLocaleString()} ؋</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-base-content/60 text-center py-8">هنوز سفارشی ثبت نشده است</p>
          )}
        </div>
      </div>
    </div>
  )
}
