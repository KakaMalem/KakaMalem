import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Order } from '@/payload-types'
import OrdersClient from './page.client'
import { getServerSideURL } from '@/utilities/getURL'

export default async function OrdersPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/orders',
  })

  // Fetch user's orders via API endpoint
  let orders: Order[] = []
  try {
    const baseURL = getServerSideURL()

    const response = await fetch(`${baseURL}/api/user-orders?limit=100&depth=2`, {
      credentials: 'include',
      cache: 'no-store',
    })

    if (response.ok) {
      const data = await response.json()
      orders = data.docs || []
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  }

  return <OrdersClient orders={orders} />
}
