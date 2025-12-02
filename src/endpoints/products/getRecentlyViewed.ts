import type { Endpoint, PayloadRequest } from 'payload'
import type { Product } from '@/payload-types'

interface RecentlyViewedItem {
  product: Product
  viewedAt: string
}

export const getRecentlyViewed: Endpoint = {
  path: '/recently-viewed',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    // Return empty array for guest users (no 401 error)
    if (!user) {
      return Response.json({
        success: true,
        data: [],
        isGuest: true,
      })
    }

    try {
      if (!req.url) {
        return Response.json({ success: false, error: 'Invalid request URL' }, { status: 400 })
      }

      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '10', 10)

      if (limit < 1 || limit > 20) {
        return Response.json(
          { success: false, error: 'Limit must be between 1 and 20' },
          { status: 400 },
        )
      }

      // Get user with recently viewed products populated
      const currentUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 2, // Populate product relationships
      })

      const recentlyViewed = (currentUser.recentlyViewed as RecentlyViewedItem[]) || []

      // Filter out any products that no longer exist and limit results
      const validProducts = recentlyViewed
        .filter((item: RecentlyViewedItem) => {
          return item.product && typeof item.product === 'object' && item.product.id
        })
        .slice(0, limit)
        .map((item: RecentlyViewedItem) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            price: item.product.price,
            salePrice: item.product.salePrice,
            currency: item.product.currency,
            images: item.product.images,
            averageRating: item.product.averageRating,
            reviewCount: item.product.reviewCount,
            stockStatus: item.product.stockStatus,
          },
          viewedAt: item.viewedAt,
        }))

      return Response.json({
        success: true,
        data: validProducts,
        isGuest: false,
      })
    } catch (error: unknown) {
      console.error('Error fetching recently viewed:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch recently viewed products',
        },
        { status: 500 },
      )
    }
  },
}
