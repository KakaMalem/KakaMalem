import type { Endpoint } from 'payload'

export const getOrderConfirmation: Endpoint = {
  path: '/order-confirmation/:id',
  method: 'get',
  handler: async (req) => {
    const { payload, user } = req
    const orderId = req.routeParams?.id

    if (!orderId) {
      return Response.json({ error: 'Order ID is required' }, { status: 400 })
    }

    try {
      // Fetch the order with populated product data
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId as string,
        depth: 2,
        overrideAccess: true, // Bypass normal access control
      })

      if (!order) {
        return Response.json({ error: 'Order not found' }, { status: 404 })
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
        return Response.json({ error: 'Access denied' }, { status: 403 })
      }

      return Response.json(order, { status: 200 })
    } catch (error: unknown) {
      console.error('Get order confirmation error:', error)

      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order'

      return Response.json({ error: errorMessage }, { status: 500 })
    }
  },
}
