import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Order } from '@/payload-types'
import AccountClient from './page.client'
import { getServerSideURL } from '@/utilities/getURL'
import { cookies } from 'next/headers'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function AccountOverviewPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account',
  })

  // Fetch user's orders via API endpoint
  let orders: Order[] = []
  try {
    const baseURL = getServerSideURL()
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')

    const response = await fetch(`${baseURL}/api/user-orders?limit=10&depth=1`, {
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

  return <AccountClient user={user} orders={orders} />
}
