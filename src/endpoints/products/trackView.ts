import type { Endpoint, PayloadRequest } from 'payload'
import type { Product } from '@/payload-types'

const MAX_RECENT_ITEMS = 20

interface RecentlyViewedItem {
  product: string | Product
  viewedAt: string
}

export const trackProductView: Endpoint = {
  path: '/track-view',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    // Guest users should use localStorage (handled client-side)
    if (!user) {
      return Response.json({
        success: true,
        message: 'Guest users use localStorage for tracking',
      })
    }

    try {
      const body = await req.json?.()
      const { productId } = body || {}

      if (!productId || typeof productId !== 'string') {
        return Response.json(
          {
            success: false,
            error: 'Product ID is required',
          },
          { status: 400 },
        )
      }

      // Verify product exists
      try {
        await payload.findByID({
          collection: 'products',
          id: productId,
        })
      } catch (_error) {
        return Response.json(
          {
            success: false,
            error: 'Product not found',
          },
          { status: 404 },
        )
      }

      // Get current user data
      const currentUser = await payload.findByID({
        collection: 'users',
        id: user.id,
      })

      const recentlyViewed = (currentUser.recentlyViewed as RecentlyViewedItem[]) || []

      // Remove the product if it already exists in the list
      const filteredViewed = recentlyViewed.filter((item: RecentlyViewedItem) => {
        const itemProductId = typeof item.product === 'string' ? item.product : item.product?.id
        return itemProductId !== productId
      })

      // Add the new view at the beginning
      const updatedViewed = [
        {
          product: productId,
          viewedAt: new Date().toISOString(),
        },
        ...filteredViewed,
      ]

      // Limit to MAX_RECENT_ITEMS
      const limitedViewed = updatedViewed.slice(0, MAX_RECENT_ITEMS)

      // Update user
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          recentlyViewed: limitedViewed,
        },
      })

      return Response.json(
        {
          success: true,
          message: 'Product view tracked',
        },
        { status: 200 },
      )
    } catch (error: unknown) {
      console.error('Error tracking product view:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to track product view',
        },
        { status: 500 },
      )
    }
  },
}
