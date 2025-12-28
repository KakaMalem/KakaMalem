import type { Endpoint, Where } from 'payload'

/**
 * Get products for a storefront
 * GET /api/get-storefront-products
 *
 * Query params:
 * - storefrontSlug: string (required)
 * - categorySlug: string (optional) - filter by seller category
 * - q: string (optional) - search query
 * - sort: string (optional) - newest, oldest, price_asc, price_desc, popular
 * - page: number (optional) - default 1
 * - limit: number (optional) - default 12
 */
export const getStorefrontProducts: Endpoint = {
  path: '/get-storefront-products',
  method: 'get',
  handler: async (req) => {
    try {
      const { payload } = req

      const url = new URL(req.url || '', 'http://localhost')
      const storefrontSlug = url.searchParams.get('storefrontSlug')
      const categorySlug = url.searchParams.get('categorySlug')
      const searchQuery = url.searchParams.get('q')
      const sort = url.searchParams.get('sort') || 'newest'
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50)

      if (!storefrontSlug) {
        return Response.json({ error: 'Storefront slug is required' }, { status: 400 })
      }

      // Find storefront
      const storefronts = await payload.find({
        collection: 'storefronts',
        where: {
          and: [{ slug: { equals: storefrontSlug } }, { status: { equals: 'active' } }],
        },
        limit: 1,
      })

      if (storefronts.docs.length === 0) {
        return Response.json({ error: 'Storefront not found' }, { status: 404 })
      }

      const storefront = storefronts.docs[0]

      // Build product query - filter by stores relationship
      const where: Where[] = [
        { stores: { contains: storefront.id } },
        { _status: { equals: 'published' } },
      ]

      // Filter by category if provided
      if (categorySlug) {
        // Find the category by slug that belongs to this store
        const categoryResult = await payload.find({
          collection: 'categories',
          where: {
            and: [{ stores: { contains: storefront.id } }, { slug: { equals: categorySlug } }],
          },
          limit: 1,
        })

        if (categoryResult.docs.length > 0) {
          const category = categoryResult.docs[0]
          // Filter products that have this category
          where.push({ categories: { contains: category.id } })
        } else {
          // Category not found - return empty
          return Response.json({
            products: [],
            pagination: {
              page,
              limit,
              totalDocs: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          })
        }
      }

      // Search query
      if (searchQuery) {
        where.push({
          or: [
            { name: { contains: searchQuery } },
            { shortDescription: { contains: searchQuery } },
          ],
        })
      }

      // Determine sort order
      let sortField = 'displayOrder'
      switch (sort) {
        case 'newest':
          sortField = '-createdAt'
          break
        case 'oldest':
          sortField = 'createdAt'
          break
        case 'price_asc':
          sortField = 'price'
          break
        case 'price_desc':
          sortField = '-price'
          break
        case 'popular':
          sortField = '-totalSold'
          break
        case 'rating':
          sortField = '-averageRating'
          break
        default:
          // Default to displayOrder (custom order set by seller)
          sortField = 'displayOrder'
      }

      // Fetch products
      const products = await payload.find({
        collection: 'products',
        where: { and: where },
        sort: sortField,
        page,
        limit,
        depth: 1,
      })

      return Response.json({
        products: products.docs,
        pagination: {
          page: products.page,
          limit: products.limit,
          totalDocs: products.totalDocs,
          totalPages: products.totalPages,
          hasNextPage: products.hasNextPage,
          hasPrevPage: products.hasPrevPage,
        },
      })
    } catch (error) {
      console.error('Get storefront products error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to get products',
        },
        { status: 500 },
      )
    }
  },
}
