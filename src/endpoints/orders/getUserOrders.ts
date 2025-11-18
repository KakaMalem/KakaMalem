import type { Endpoint } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'

export const getUserOrders: Endpoint = {
  path: '/user-orders',
  method: 'get',
  handler: async (req) => {
    const { payload, user } = req

    // Check if user is authenticated
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get query parameters
      const baseURL = getServerSideURL()
      const urlString = req.url || `${baseURL}/api/user-orders`
      const url = new URL(urlString)
      const limit = parseInt(url.searchParams.get('limit') || '100', 10)
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const depth = parseInt(url.searchParams.get('depth') || '2', 10)

      // Fetch orders for the current user
      const orders = await payload.find({
        collection: 'orders',
        where: {
          customer: {
            equals: user.id,
          },
        },
        limit,
        page,
        depth,
        sort: '-createdAt',
      })

      return Response.json(orders, { status: 200 })
    } catch (error: unknown) {
      console.error('Get user orders error:', error)

      return Response.json({ error: 'Failed to fetch orders. Please try again.' }, { status: 500 })
    }
  },
}
