import type { Endpoint, PayloadRequest } from 'payload'
import type { Product } from '@/payload-types'

const MAX_RECENT_ITEMS = 20

// interface GuestViewedItem {
//   productId: string
//   viewedAt: string
// }

interface RecentlyViewedItem {
  product: string | Product
  viewedAt: string
}

export const mergeRecentlyViewed: Endpoint = {
  path: '/merge-recently-viewed',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    // Guest users can't merge - return success without doing anything
    if (!user) {
      return Response.json({
        success: true,
        message: 'No user to merge with (guest mode)',
        data: {
          mergedCount: 0,
          totalCount: 0,
        },
      })
    }

    try {
      const body = await req.json?.()
      const { guestItems } = body || {}

      if (!Array.isArray(guestItems)) {
        return Response.json(
          {
            success: false,
            error: 'Guest items must be an array',
          },
          { status: 400 },
        )
      }

      // Get current user data
      const currentUser = await payload.findByID({
        collection: 'users',
        id: user.id,
      })

      const existingViewed = (currentUser.recentlyViewed as RecentlyViewedItem[]) || []

      // Create a map of existing product IDs to avoid duplicates
      const existingProductIds = new Set(
        existingViewed.map((item: RecentlyViewedItem) => {
          return typeof item.product === 'string' ? item.product : item.product?.id
        }),
      )

      // Process guest items
      const validGuestItems: Array<{ product: string; viewedAt: string }> = []

      for (const guestItem of guestItems) {
        if (!guestItem.productId || !guestItem.viewedAt) continue

        // Skip if already in user's recently viewed
        if (existingProductIds.has(guestItem.productId)) continue

        // Verify product exists
        try {
          await payload.findByID({
            collection: 'products',
            id: guestItem.productId,
          })

          validGuestItems.push({
            product: guestItem.productId,
            viewedAt: guestItem.viewedAt,
          })
        } catch (_error) {
          // Product doesn't exist, skip it
          console.debug(`Skipping non-existent product: ${guestItem.productId}`)
        }
      }

      // Merge: guest items first (most recent from guest session), then existing items
      const mergedViewed = [...validGuestItems, ...existingViewed]

      // Sort by viewedAt (most recent first) and limit to MAX_RECENT_ITEMS
      const sortedViewed = mergedViewed
        .sort((a, b) => {
          const dateA = new Date(a.viewedAt).getTime()
          const dateB = new Date(b.viewedAt).getTime()
          return dateB - dateA // Descending order
        })
        .slice(0, MAX_RECENT_ITEMS)

      // Update user
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          recentlyViewed: sortedViewed,
        },
      })

      return Response.json(
        {
          success: true,
          message: 'Recently viewed items merged successfully',
          data: {
            mergedCount: validGuestItems.length,
            totalCount: sortedViewed.length,
          },
        },
        { status: 200 },
      )
    } catch (error: unknown) {
      console.error('Error merging recently viewed:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to merge recently viewed items',
        },
        { status: 500 },
      )
    }
  },
}
