'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMockOrders } from '@/lib/mockUser'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    setOrders(getMockOrders())
  }, [])

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      delivered: 'badge-success',
      shipped: 'badge-info',
      processing: 'badge-warning',
      cancelled: 'badge-accent',
    }
    return badges[status] || 'badge-ghost'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order History</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card bg-base-200">
            <div className="card-body">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                  <p className="text-sm opacity-70">Placed on {order.createdAt}</p>
                  <p className="text-sm mt-1">{order.items} items</p>
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className="text-2xl font-bold">
                    {order.currency} {order.total}
                  </div>
                  <span className={`badge ${getStatusBadge(order.status)}`}>{order.status}</span>
                  <Link href={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
