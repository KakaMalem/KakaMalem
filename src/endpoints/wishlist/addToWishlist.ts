import type { Endpoint } from 'payload'
import type { Product } from '@/payload-types'

export const addToWishlist: Endpoint = {
  path: '/wishlist/add',
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

      // Check if already in wishlist
      if (currentWishlist.includes(productId)) {
        return Response.json({ error: 'Product already in wishlist' }, { status: 400 })
      }

      // Add to wishlist
      const updatedUser = await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          wishlist: [...currentWishlist, productId],
        },
      })

      return Response.json({
        success: true,
        wishlist: updatedUser.wishlist,
      })
    } catch (error: unknown) {
      console.error('Error adding to wishlist:', error)
      return Response.json({ error: 'Failed to add to wishlist' }, { status: 500 })
    }
  },
}
