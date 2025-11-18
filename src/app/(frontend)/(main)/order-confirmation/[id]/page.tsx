import React from 'react'
import { getServerSideURL } from '@/utilities/getURL'
import { cookies } from 'next/headers'
import OrderConfirmationClient from './page.client'
import { redirect } from 'next/navigation'

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await Promise.resolve(params)

  try {
    const baseURL = getServerSideURL()
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')

    // Fetch the order with populated product data
    const response = await fetch(`${baseURL}/api/orders/${id}?depth=2`, {
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
  } catch (error) {
    console.error('Error fetching order:', error)
    redirect('/shop')
  }
}
