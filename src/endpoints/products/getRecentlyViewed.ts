import type { Endpoint, PayloadRequest } from 'payload'
import type { Product } from '@/payload-types'

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

      // Get user with recently viewed products (minimal depth, we'll fetch products separately)
      const currentUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 1,
      })

      const recentlyViewed = (currentUser.recentlyViewed || []) as Array<{
        product: string | Product
        viewedAt: string
      }>

      // Extract product IDs and viewedAt timestamps
      const productIdsWithTimestamps = recentlyViewed
        .map((item) => ({
          productId: typeof item.product === 'string' ? item.product : item.product?.id,
          viewedAt: item.viewedAt,
        }))
        .filter((item) => item.productId)
        .slice(0, limit)

      if (productIdsWithTimestamps.length === 0) {
        return Response.json(
          {
            success: true,
            data: [],
            isGuest: false,
          },
          {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            },
          },
        )
      }

      // Fetch fresh product data with current ratings
      const productIds = productIdsWithTimestamps.map((p) => p.productId) as string[]
      const productsResult = await payload.find({
        collection: 'products',
        where: {
          id: { in: productIds },
        },
        depth: 1,
        limit: productIds.length,
      })

      // Create a map for quick lookup
      const productsMap = new Map(productsResult.docs.map((p) => [p.id, p]))

      // Build response maintaining original order with fresh product data
      const validProducts = await Promise.all(
        productIdsWithTimestamps.map(async (item) => {
          const product = productsMap.get(item.productId as string)
          if (!product) return null

          const productData: Record<string, unknown> = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            salePrice: product.salePrice,
            currency: product.currency,
            images: product.images,
            averageRating: product.averageRating,
            reviewCount: product.reviewCount,
            stockStatus: product.stockStatus,
            hasVariants: product.hasVariants,
          }

          // If product has variants, fetch default variant images (or first variant if no default)
          if (product.hasVariants) {
            try {
              // Try to fetch default variant first
              let variantResult = await payload.find({
                collection: 'product-variants',
                where: {
                  and: [{ product: { equals: product.id } }, { isDefault: { equals: true } }],
                },
                limit: 1,
                depth: 1,
              })

              // If no default variant, fetch first variant
              if (variantResult.docs.length === 0) {
                variantResult = await payload.find({
                  collection: 'product-variants',
                  where: {
                    product: { equals: product.id },
                  },
                  limit: 1,
                  depth: 1,
                  sort: 'createdAt', // Get the first created variant
                })
              }

              if (variantResult.docs.length > 0) {
                const variant = variantResult.docs[0]
                const hasVariantImages =
                  variant.images && Array.isArray(variant.images) && variant.images.length > 0

                if (hasVariantImages) {
                  productData.defaultVariantImages = variant.images
                }
                if (variant.price !== undefined && variant.price !== null) {
                  productData.defaultVariantPrice = variant.price
                }
                if (variant.compareAtPrice !== undefined && variant.compareAtPrice !== null) {
                  productData.defaultVariantCompareAtPrice = variant.compareAtPrice
                }
              }
            } catch (error) {
              console.error(`Error fetching variant for product ${product.id}:`, error)
            }
          }

          return {
            product: productData,
            viewedAt: item.viewedAt,
          }
        }),
      )

      // Filter out null entries (products that no longer exist)
      const filteredValidProducts = validProducts.filter((p) => p !== null)

      return Response.json(
        {
          success: true,
          data: filteredValidProducts,
          isGuest: false,
        },
        {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        },
      )
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
