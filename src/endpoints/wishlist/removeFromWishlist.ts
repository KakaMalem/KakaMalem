import type { Endpoint } from 'payload'
import type { Product } from '@/payload-types'

export const removeFromWishlist: Endpoint = {
  path: '/wishlist/remove',
  method: 'post',
  handler: async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { productId: string }
    try {
      body = (await req.json?.()) || req.body
    } catch (_e) {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { productId } = body

    if (!productId) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 })
    }

    try {
      // Get current wishlist
      const currentUser = await payload.findByID({
        collection: 'users',
        id: user.id,
      })

      // Handle both string IDs and populated Product objects
      const currentWishlist = ((currentUser.wishlist || []) as Array<string | Product>).map(
        (item) => (typeof item === 'string' ? item : item.id),
      )

      // Remove from wishlist
      const updatedWishlist = currentWishlist.filter((id) => id !== productId)

      const updatedUser = await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          wishlist: updatedWishlist,
        },
      })

      return Response.json({
        success: true,
        wishlist: updatedUser.wishlist,
      })
    } catch (_error) {
      console.error('Error removing from wishlist:', _error)
      return Response.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
    }
  },
}
