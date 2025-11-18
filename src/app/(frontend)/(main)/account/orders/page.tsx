import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Order } from '@/payload-types'
import OrdersClient from './page.client'
import { getServerSideURL } from '@/utilities/getURL'
import { cookies } from 'next/headers'

export default async function OrdersPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/orders',
  })

  // Fetch user's orders via API endpoint
  let orders: Order[] = []
  try {
    const baseURL = getServerSideURL()
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')

    const response = await fetch(`${baseURL}/api/user-orders?limit=100&depth=2`, {
      headers: {
        Cookie: token ? `payload-token=${token.value}` : '',
      },
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
