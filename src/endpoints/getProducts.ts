import type { Endpoint } from 'payload'

interface SearchQuery {
  q?: string // Search query
  category?: string // Category slug or ID
  minPrice?: number
  maxPrice?: number
  rating?: number // Minimum rating
  sort?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'featured'
  page?: number
  limit?: number
}

export const getProducts: Endpoint = {
  path: '/products',
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
      }

      // Build where clause
      const where: any = {
        and: [
          { status: { equals: 'published' } }, // Only show published products
        ],
      }

      // Search by name or description
      if (searchParams.q) {
        where.and.push({
          or: [
            { name: { contains: searchParams.q } },
            { shortDescription: { contains: searchParams.q } },
          ],
        })
      }

      // Filter by category
      if (searchParams.category) {
        where.and.push({
          categories: { contains: searchParams.category },
        })
      }

      // Filter by price range
      if (searchParams.minPrice !== undefined) {
        where.and.push({
          price: { greater_than_equal: searchParams.minPrice },
        })
      }

      if (searchParams.maxPrice !== undefined) {
        where.and.push({
          price: { less_than_equal: searchParams.maxPrice },
        })
      }

      // Filter by rating
      if (searchParams.rating !== undefined) {
        where.and.push({
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

      // Return results
      return Response.json(
        {
          success: true,
          products: results.docs,
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
        { status: 200 },
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
