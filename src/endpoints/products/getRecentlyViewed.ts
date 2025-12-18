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
      const filteredProducts = recentlyViewed
        .filter((item: RecentlyViewedItem) => {
          return item.product && typeof item.product === 'object' && item.product.id
        })
        .slice(0, limit)

      // For products with variants, fetch default variant data
      const validProducts = await Promise.all(
        filteredProducts.map(async (item: RecentlyViewedItem) => {
          const product = item.product
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
