import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getServerSideURL } from '@/utilities/getURL'
import type { Order } from '@/payload-types'
import AccountClient from './page.client'

export default async function AccountOverviewPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account',
  })

  // Fetch user's orders
  let orders: Order[] = []
  try {
    const ordersRes = await fetch(
      `${getServerSideURL()}/api/orders?where[customer][equals]=${user.id}&limit=10&sort=-createdAt`,
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

  return <AccountClient user={user} orders={orders} />
}
