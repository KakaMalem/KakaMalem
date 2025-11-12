import type { PayloadRequest, Endpoint } from 'payload'
import { saveGuestCart, createCartResponse } from '../../utilities/cartUtils'

export const clearCart: Endpoint = {
  path: '/cart/clear',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const user = req.user

      // Clear cart
      if (user) {
        // Clear user's database cart
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: {
            cart: { items: [] },
          },
        })
      }

      // Always clear guest cart cookie (for both authenticated and guest users)
      // This prevents old guest cart from appearing after logout
      await saveGuestCart(req, { items: [] })

      return createCartResponse(
        {
          success: true,
          message: 'Cart cleared successfully',
          data: {
            itemCount: 0,
            items: [],
          },
        },
        200,
        req,
      )
    } catch (error) {
      console.error('Error clearing cart:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to clear cart',
        },
        { status: 500 },
      )
    }
  },
}
