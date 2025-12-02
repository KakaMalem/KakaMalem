import { getPayload } from 'payload'
import config from '@/payload.config'
import { getMeUser } from '@/utilities/getMeUser'
import { notFound } from 'next/navigation'
import OrderDetailsClient from './page.client'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { user } = await getMeUser({
    nullUserRedirect: `/auth/login?redirect=/account/orders/${id}`,
  })

  const payload = await getPayload({ config })

  try {
    // Fetch the order
    const order = await payload.findByID({
      collection: 'orders',
      id: id,
      depth: 2, // Populate product details
    })

    // Check if order belongs to the current user
    const customerId = typeof order.customer === 'string' ? order.customer : order.customer?.id

    if (customerId !== user.id) {
      // User trying to access someone else's order
      notFound()
    }

    return <OrderDetailsClient order={order} user={user} />
  } catch (error) {
    console.error('Error fetching order:', error)
    notFound()
  }
}
