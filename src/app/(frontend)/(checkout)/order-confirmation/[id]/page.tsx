import React from 'react'
import { getServerSideURL } from '@/utilities/getURL'
import { cookies } from 'next/headers'
import OrderConfirmationClient from './page.client'
import { redirect } from 'next/navigation'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await params

  try {
    const baseURL = getServerSideURL()
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')

    // Fetch the order using the confirmation endpoint (works for both guests and authenticated users)
    const response = await fetch(`${baseURL}/api/order-confirmation/${id}`, {
      headers: {
        Cookie: token ? `payload-token=${token.value}` : '',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      redirect('/shop')
    }

    const order = await response.json()

    return <OrderConfirmationClient order={order} />
  } catch (_error) {
    redirect('/shop')
  }
}
