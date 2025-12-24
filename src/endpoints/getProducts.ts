import type { Endpoint, Where } from 'payload'

interface SearchQuery {
  q?: string // Search query
  category?: string // Category slug or ID
  minPrice?: number
  maxPrice?: number
  rating?: number // Minimum rating
  sort?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'featured'
  page?: number
  limit?: number
  ids?: string[] // Specific product IDs to fetch
}

export const getProducts: Endpoint = {
  path: '/search-products',
  method: 'get',
  handler: async (req) => {
    const { payload } = req

    try {
      // Parse query parameters - handle undefined URL
      if (!req.url) {
        return Response.json(
          {
            success: false,
            error: 'Invalid request URL',
            products: [],
            pagination: {
              page: 1,
              limit: 12,
              totalPages: 0,
              totalDocs: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
          { status: 400 },
        )
      }

      const url = new URL(req.url)
      const searchParams: SearchQuery = {
        q: url.searchParams.get('q') || undefined,
        category: url.searchParams.get('category') || undefined,
        minPrice: url.searchParams.get('minPrice')
          ? parseFloat(url.searchParams.get('minPrice')!)
          : undefined,
        maxPrice: url.searchParams.get('maxPrice')
          ? parseFloat(url.searchParams.get('maxPrice')!)
          : undefined,
        rating: url.searchParams.get('rating')
          ? parseFloat(url.searchParams.get('rating')!)
          : undefined,
        sort: (url.searchParams.get('sort') as SearchQuery['sort']) || 'featured',
        page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1,
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 12,
        ids: url.searchParams.get('ids')
          ? url.searchParams.get('ids')!.split(',').filter(Boolean)
          : undefined,
      }

      // Build where clause
      const where: Where = {
        and: [
          // Show published products or products without _status (legacy)
          {
            or: [{ _status: { equals: 'published' } }, { _status: { exists: false } }],
          },
        ],
      }

      // Filter by specific IDs (takes precedence over other filters)
      if (searchParams.ids && searchParams.ids.length > 0) {
        where.and?.push({
          id: { in: searchParams.ids },
        })
      } else {
        // Only apply these filters if not fetching specific IDs

        // Search by name or description
        if (searchParams.q) {
          where.and?.push({
            or: [
              { name: { contains: searchParams.q } },
              { shortDescription: { contains: searchParams.q } },
            ],
          })
        }

        // Filter by category (accepts slug or id)
        if (searchParams.category) {
          const rawCategory = String(searchParams.category).trim()

          // Heuristics: Payload IDs might be 24-hex (Mongo) or UUID (36 chars with dashes).
          const looksLikeMongoId = /^[0-9a-fA-F]{24}$/.test(rawCategory)
          const looksLikeUUID = /^[0-9a-fA-F-]{36}$/.test(rawCategory)

          let categoryIdToUse = rawCategory

          // If it doesn't look like an id, try to resolve as a slug
          if (!looksLikeMongoId && !looksLikeUUID) {
            const catResult = await payload.find({
              collection: 'categories',
              where: { slug: { equals: rawCategory } },
              limit: 1,
              depth: 0,
            })

            if (!catResult.docs.length) {
              // No category found for that slug -> return empty result set early
              return Response.json(
                {
                  success: true,
                  products: [],
                  pagination: {
                    page: searchParams.page ?? 1,
                    limit: searchParams.limit ?? 12,
                    totalPages: 0,
                    totalDocs: 0,
                    hasNextPage: false,
                    hasPrevPage: false,
                  },
                  filters: {
                    query: searchParams.q,
                    category: searchParams.category,
                    minPrice: searchParams.minPrice,
                    maxPrice: searchParams.maxPrice,
                    rating: searchParams.rating,
                    sort: searchParams.sort,
                  },
                },
                { status: 200 },
              )
            }

            categoryIdToUse = catResult.docs[0].id
          }

          // Finally add the relationship filter using the category ID
          where.and?.push({
            categories: { contains: categoryIdToUse },
          })
        }
      }

      // Filter by price range
      if (searchParams.minPrice !== undefined) {
        where.and?.push({
          price: { greater_than_equal: searchParams.minPrice },
        })
      }

      if (searchParams.maxPrice !== undefined) {
        where.and?.push({
          price: { less_than_equal: searchParams.maxPrice },
        })
      }

      // Filter by rating
      if (searchParams.rating !== undefined) {
        where.and?.push({
          averageRating: { greater_than_equal: searchParams.rating },
        })
      }

      // Determine sort order
      let sort: string = '-createdAt' // Default: newest first

      switch (searchParams.sort) {
        case 'price-asc':
          sort = 'price'
          break
        case 'price-desc':
          sort = '-price'
          break
        case 'rating':
          sort = '-averageRating'
          break
        case 'newest':
          sort = '-createdAt'
          break
        case 'featured':
          sort = '-featured,-createdAt' // Featured first, then newest
          break
      }

      // Execute search
      const results = await payload.find({
        collection: 'products',
        where,
        sort,
        page: searchParams.page,
        limit: searchParams.limit,
        depth: 2, // Include categories and images
      })

      // For products with variants, fetch the best variant to display
      // Priority with availability:
      // 1) Default variant (if available)
      // 2) Best-selling available variant
      // 3) Default variant (even if unavailable - respects admin choice)
      // 4) Best-selling variant (even if unavailable)
      // 5) First available variant
      // 6) First variant (fallback)
      const productsWithDefaultVariants = await Promise.all(
        results.docs.map(async (product) => {
          if (product.hasVariants) {
            try {
              let selectedVariant = null

              // Helper function to check if variant is available
              const isAvailable = (variant: { stockStatus?: string }) =>
                variant.stockStatus !== 'out_of_stock' && variant.stockStatus !== 'discontinued'

              // Fetch default variant (isDefault: true)
              const defaultVariantResult = await payload.find({
                collection: 'product-variants',
                where: {
                  and: [{ product: { equals: product.id } }, { isDefault: { equals: true } }],
                },
                limit: 1,
                depth: 1, // Include images
              })

              const defaultVariant =
                defaultVariantResult.docs.length > 0 ? defaultVariantResult.docs[0] : null

              // Fetch all variants for fallback logic
              const allVariantsResult = await payload.find({
                collection: 'product-variants',
                where: {
                  product: { equals: product.id },
                },
                limit: 100, // Reasonable limit
                depth: 1,
                sort: '-totalSold,createdAt', // Sort by totalSold descending, then by creation
              })

              const allVariants = allVariantsResult.docs

              // PRIORITY 1: Default variant if it's AVAILABLE
              if (defaultVariant && isAvailable(defaultVariant)) {
                selectedVariant = defaultVariant
              }
              // PRIORITY 2: Best-selling AVAILABLE variant (if default is unavailable or doesn't exist)
              else if (allVariants.length > 0) {
                const availableVariants = allVariants.filter(isAvailable)
                const variantsWithSales = allVariants.filter((v) => (v.totalSold || 0) > 0)
                const availableWithSales = availableVariants.filter((v) => (v.totalSold || 0) > 0)

                if (availableWithSales.length > 0) {
                  // Best-selling available variant
                  selectedVariant = availableWithSales[0]
                }
                // PRIORITY 3: Default variant (even if unavailable - shows admin's choice)
                else if (defaultVariant) {
                  selectedVariant = defaultVariant
                }
                // PRIORITY 4: Best-selling variant (even if unavailable)
                else if (variantsWithSales.length > 0) {
                  selectedVariant = variantsWithSales[0]
                }
                // PRIORITY 5: First AVAILABLE variant (no sales yet)
                else if (availableVariants.length > 0) {
                  selectedVariant = availableVariants[0]
                }
                // PRIORITY 6: First variant (fallback - all unavailable)
                else {
                  selectedVariant = allVariants[0]
                }
              }

              // If we found a variant, enrich product with variant data
              if (selectedVariant) {
                const hasVariantImages =
                  selectedVariant.images &&
                  Array.isArray(selectedVariant.images) &&
                  selectedVariant.images.length > 0

                // Add selected variant data to product
                return {
                  ...product,
                  defaultVariantId: selectedVariant.id,
                  defaultVariantSku: selectedVariant.sku,
                  defaultVariantStockStatus: selectedVariant.stockStatus,
                  defaultVariantTotalSold: selectedVariant.totalSold || 0,
                  defaultVariantQuantity: selectedVariant.quantity,
                  ...(hasVariantImages && { defaultVariantImages: selectedVariant.images }),
                  ...(selectedVariant.price !== undefined &&
                    selectedVariant.price !== null && {
                      defaultVariantPrice: selectedVariant.price,
                    }),
                  ...(selectedVariant.compareAtPrice !== undefined &&
                    selectedVariant.compareAtPrice !== null && {
                      defaultVariantCompareAtPrice: selectedVariant.compareAtPrice,
                    }),
                }
              }
            } catch (error) {
              console.error(`Error fetching variant for product ${product.id}:`, error)
            }
          }
          return product
        }),
      )

      // Return results with no-cache headers to ensure fresh data
      return Response.json(
        {
          success: true,
          products: productsWithDefaultVariants,
          pagination: {
            page: results.page,
            limit: results.limit,
            totalPages: results.totalPages,
            totalDocs: results.totalDocs,
            hasNextPage: results.hasNextPage,
            hasPrevPage: results.hasPrevPage,
            nextPage: results.nextPage,
            prevPage: results.prevPage,
          },
          filters: {
            query: searchParams.q,
            category: searchParams.category,
            minPrice: searchParams.minPrice,
            maxPrice: searchParams.maxPrice,
            rating: searchParams.rating,
            sort: searchParams.sort,
          },
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        },
      )
    } catch (error: unknown) {
      console.error('Products fetch error:', error)

      return Response.json(
        {
          success: false,
          error: 'Failed to fetch products. Please try again.',
          products: [],
          pagination: {
            page: 1,
            limit: 12,
            totalPages: 0,
            totalDocs: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        { status: 500 },
      )
    }
  },
}
