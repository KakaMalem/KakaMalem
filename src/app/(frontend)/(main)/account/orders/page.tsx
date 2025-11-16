import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getServerSideURL } from '@/utilities/getURL'
import type { Order } from '@/payload-types'
import OrdersClient from './page.client'

export default async function OrdersPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/orders',
  })

  // Fetch user's orders
  let orders: Order[] = []
  try {
    const ordersRes = await fetch(
      `${getServerSideURL()}/api/orders?where[customer][equals]=${user.id}&depth=2&sort=-createdAt&limit=100`,
      {
        cache: 'no-store',
      },
    )

    if (ordersRes.ok) {
      const ordersData = await ordersRes.json()
      orders = ordersData.docs || []
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  }

  return <OrdersClient orders={orders} />
}
