import type { Endpoint } from 'payload'

/**
 * GET /api/variants/product/:productId
 * Fetch all variants for a specific product
 */
export const getProductVariants: Endpoint = {
  path: '/variants/product/:productId',
  method: 'get',
  handler: async (req) => {
    try {
      const { productId } = req.routeParams || {}

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
        const product = await req.payload.findByID({
          collection: 'products',
          id: productId,
        })

        if (!product) {
          return Response.json(
            {
              success: false,
              error: 'Product not found',
            },
            { status: 404 },
          )
        }

        // Check if product is published (for non-admin users)
        if (
          !req.user?.roles?.includes('admin') &&
          !req.user?.roles?.includes('developer') &&
          !req.user?.roles?.includes('seller') &&
          product._status &&
          product._status !== 'published'
        ) {
          return Response.json(
            {
              success: false,
              error: 'Product not available',
            },
            { status: 404 },
          )
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        return Response.json(
          {
            success: false,
            error: 'Product not found',
          },
          { status: 404 },
        )
      }

      // Fetch variants for this product
      const variants = await req.payload.find({
        collection: 'product-variants',
        where: {
          product: {
            equals: productId,
          },
        },
        depth: 1,
        limit: 100, // Reasonable limit for variants per product
        sort: 'isDefault', // Default variants first
      })

      return Response.json(
        {
          success: true,
          data: variants.docs,
          total: variants.totalDocs,
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Error fetching product variants:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch variants',
        },
        { status: 500 },
      )
    }
  },
}
