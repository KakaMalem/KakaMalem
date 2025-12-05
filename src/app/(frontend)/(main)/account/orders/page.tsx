import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import type { Order } from '@/payload-types'
import OrdersClient from './page.client'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/orders',
  })

  // Fetch user's orders using Payload local API
  let orders: Order[] = []
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'orders',
      where: {
        customer: {
          equals: user?.id,
        },
      },
      limit: 100,
      depth: 2,
      sort: '-createdAt',
    })

    orders = result.docs
    console.log(`[Orders Page] Fetched ${orders.length} orders for user ${user?.id}`)
  } catch (error) {
    console.error('[Orders Page] Error fetching orders:', error)
  }

  return <OrdersClient orders={orders} />
}
