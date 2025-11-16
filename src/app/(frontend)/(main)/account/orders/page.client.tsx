'use client'

import React from 'react'
import Link from 'next/link'
import { Package, Calendar, CreditCard, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { Order } from '@/payload-types'

interface OrdersClientProps {
  orders: Order[]
}

export default function OrdersClient({ orders }: OrdersClientProps) {
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      delivered: 'badge-success',
      shipped: 'badge-info',
      processing: 'badge-warning',
      cancelled: 'badge-error',
      pending: 'badge-ghost',
    }
    return badges[status] || 'badge-ghost'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-info" />
      case 'processing':
        return <Clock className="w-5 h-5 text-warning" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-error" />
      default:
        return <Package className="w-5 h-5 text-base-content/50" />
    }
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Order History</h2>
        <div className="card bg-base-200">
          <div className="card-body text-center py-12">
            <Package className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Orders Yet</h3>
            <p className="text-base-content/70 mb-6">
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <Link href="/shop" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Order History</h2>
          <p className="text-base-content/70 mt-1">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          const itemCount = order.items?.length || 0

          return (
            <div key={order.id} className="card bg-base-200 hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-base-300 rounded-lg">
                        {getStatusIcon(order.status || 'pending')}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id.slice(-8)}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-base-content/70 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {orderDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pl-14">
                        <p className="text-sm text-base-content/60 mb-2">Items:</p>
                        <div className="space-y-1">
                          {order.items.slice(0, 3).map((item: any, index: number) => {
                            const product =
                              typeof item.product === 'object' ? item.product : null
                            return (
                              <div key={index} className="text-sm text-base-content/80">
                                • {product?.name || 'Product'} {item.quantity > 1 && `(×${item.quantity})`}
                              </div>
                            )
                          })}
                          {order.items.length > 3 && (
                            <div className="text-sm text-base-content/60">
                              and {order.items.length - 3} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Status & Total */}
                  <div className="flex flex-col items-end gap-3 lg:min-w-[200px]">
                    <div className="text-right">
                      <div className="text-sm text-base-content/60 mb-1">Total Amount</div>
                      <div className="text-2xl font-bold flex items-center gap-1">
                        <CreditCard className="w-5 h-5 text-base-content/50" />
                        USD {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
                      </div>
                    </div>

                    <span className={`badge ${getStatusBadge(order.status || 'pending')} badge-lg`}>
                      {order.status || 'pending'}
                    </span>

                    <div className="flex gap-2">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
