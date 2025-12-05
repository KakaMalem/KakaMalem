import type { Endpoint } from 'payload'

/**
 * Get product analytics
 * Restricted to superadmins and developers only
 */
export const getProductAnalytics: Endpoint = {
  path: '/products/:id/analytics',
  method: 'get',
  handler: async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check access: only superadmins and developers
    const isAuthorized = user.roles?.includes('superadmin') || user.roles?.includes('developer')

    if (!isAuthorized) {
      return Response.json(
        { error: 'Only superadmins and developers can view analytics' },
        { status: 403 },
      )
    }

    // Get product ID from URL params
    const productId = req.routeParams?.id

    if (!productId || typeof productId !== 'string') {
      return Response.json({ error: 'Product ID is required' }, { status: 400 })
    }

    try {
      // Get product
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
      })

      const analytics = product.analytics || {}

      // Return analytics with calculated metrics
      return Response.json({
        success: true,
        productId: product.id,
        productName: product.name,
        analytics: {
          viewCount: analytics.viewCount || 0,
          uniqueViewCount: analytics.uniqueViewCount || 0,
          addToCartCount: analytics.addToCartCount || 0,
          wishlistCount: analytics.wishlistCount || 0,
          totalSold: product.totalSold || 0,
          conversionRate: analytics.conversionRate || 0,
          cartConversionRate: analytics.cartConversionRate || 0,
          lastViewedAt: analytics.lastViewedAt || null,
          // Calculated metrics
          cartRate:
            (analytics.viewCount || 0) > 0
              ? parseFloat(
                  (((analytics.addToCartCount || 0) / (analytics.viewCount || 1)) * 100).toFixed(2),
                )
              : 0,
          wishlistRate:
            (analytics.viewCount || 0) > 0
              ? parseFloat(
                  (((analytics.wishlistCount || 0) / (analytics.viewCount || 1)) * 100).toFixed(2),
                )
              : 0,
          averageRating: product.averageRating || 0,
          reviewCount: product.reviewCount || 0,
        },
      })
    } catch (error: unknown) {
      console.error('Error fetching product analytics:', error)
      return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }
  },
}
