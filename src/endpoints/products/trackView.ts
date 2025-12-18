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

      // Verify product exists and get current analytics
      let product
      try {
        product = await payload.findByID({
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

      // Update product analytics
      const analytics = product.analytics || {}
      const viewedByUsers = (analytics.viewedByUsers || []) as Array<{
        userId?: string
        viewedAt?: string
        id?: string | null
      }>

      // Check if this is a unique view
      const isUniqueView = !viewedByUsers.some((v) => v.userId === user.id)

      // Update viewedByUsers array (keep last 1000 unique users)
      const updatedViewedByUsers: Array<{
        userId: string
        viewedAt: string
      }> = isUniqueView
        ? [
            { userId: user.id, viewedAt: new Date().toISOString() },
            ...viewedByUsers.map((v) => ({
              userId: v.userId || '',
              viewedAt: v.viewedAt || new Date().toISOString(),
            })),
          ].slice(0, 1000)
        : viewedByUsers.map((v) =>
            v.userId === user.id
              ? { userId: user.id, viewedAt: new Date().toISOString() }
              : { userId: v.userId || '', viewedAt: v.viewedAt || new Date().toISOString() },
          )

      // Calculate updated analytics
      const viewCount = (analytics.viewCount || 0) + 1
      const uniqueViewCount = isUniqueView
        ? (analytics.uniqueViewCount || 0) + 1
        : analytics.uniqueViewCount || 0

      // Calculate conversion rates
      const totalSold = product.totalSold || 0
      const addToCartCount = analytics.addToCartCount || 0
      const conversionRate = viewCount > 0 ? (totalSold / viewCount) * 100 : 0
      const cartConversionRate = addToCartCount > 0 ? (totalSold / addToCartCount) * 100 : 0

      // Update both user and product in parallel
      await Promise.all([
        payload.update({
          collection: 'users',
          id: user.id,
          data: {
            recentlyViewed: limitedViewed,
          },
        }),
        payload.update({
          collection: 'products',
          id: productId,
          data: {
            analytics: {
              viewCount,
              uniqueViewCount,
              addToCartCount: analytics.addToCartCount || 0,
              wishlistCount: analytics.wishlistCount || 0,
              conversionRate: parseFloat(conversionRate.toFixed(2)),
              cartConversionRate: parseFloat(cartConversionRate.toFixed(2)),
              lastViewedAt: new Date().toISOString(),
              viewedByUsers: updatedViewedByUsers,
            },
          },
        }),
      ])

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
