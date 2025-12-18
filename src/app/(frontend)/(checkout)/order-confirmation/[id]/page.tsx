import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import OrderConfirmationClient from './page.client'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'تأیید سفارش',
  description: 'سفارش شما با موفقیت ثبت شد',
  robots: { index: false, follow: false },
}

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await params

  try {
    const payload = await getPayload({ config })
    const { user } = await getMeUser({ nullUserRedirect: undefined })

    // Fetch the order with fully populated product and variant data using local API
    // Depth 4 ensures complete population: order -> items.variant -> variant.images -> Media objects
    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 4,
      overrideAccess: true, // Bypass normal access control to ensure all data is fetched
    })

    if (!order) {
      redirect('/')
    }

    // Verify access: either the customer who placed it, or it's a recent guest order
    let hasAccess = false

    // Check if authenticated user owns this order
    if (user && order.customer) {
      hasAccess =
        typeof order.customer === 'string'
          ? order.customer === user.id
          : order.customer.id === user.id
    }

    // For guest orders, allow access if order is recent (within last 24 hours)
    // This prevents unauthorized access while allowing immediate confirmation viewing
    if (!hasAccess && order.guestEmail) {
      const orderDate = new Date(order.createdAt)
      const now = new Date()
      const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)

      if (hoursSinceOrder < 24) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      redirect('/')
    }

    return <OrderConfirmationClient order={order} />
  } catch (_error) {
    redirect('/')
  }
}
