import type { Endpoint, PayloadRequest } from 'payload'

export const getProductReviews: Endpoint = {
  path: '/product-reviews',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    try {
      // Parse query parameters
      if (!req.url) {
        return Response.json(
          {
            success: false,
            error: 'Invalid request URL',
          },
          { status: 400 },
        )
      }

      const url = new URL(req.url)
      const productId = url.searchParams.get('productId')

      if (!productId || typeof productId !== 'string') {
        return Response.json(
          {
            success: false,
            error: 'Product ID is required',
          },
          { status: 400 },
        )
      }

      // Parse pagination and sorting parameters
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '10', 10)
      const sortBy = url.searchParams.get('sortBy') || 'createdAt'
      const sortOrder = url.searchParams.get('sortOrder') || 'desc'

      // Validate pagination
      if (page < 1 || limit < 1 || limit > 50) {
        return Response.json(
          {
            success: false,
            error:
              'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 50.',
          },
          { status: 400 },
        )
      }

      // Verify product exists and get its stats
      let product: any
      try {
        product = await payload.findByID({
          collection: 'products',
          id: productId,
        })
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: 'Product not found',
          },
          { status: 404 },
        )
      }

      // Build the query - show only approved reviews
      const whereClause: any = {
        and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
      }

      // Determine sort field
      let sort = '-createdAt'
      if (sortBy === 'rating') {
        sort = sortOrder === 'asc' ? 'rating' : '-rating'
      } else if (sortBy === 'helpful') {
        sort = sortOrder === 'asc' ? 'helpful' : '-helpful'
      } else {
        sort = sortOrder === 'asc' ? 'createdAt' : '-createdAt'
      }

      // Fetch reviews with populated user data
      const reviews = await payload.find({
        collection: 'reviews',
        where: whereClause,
        page,
        limit,
        sort,
        depth: 2,
      })

      // Calculate rating distribution only (we get avg and count from product)
      const allReviews = await payload.find({
        collection: 'reviews',
        where: whereClause,
        limit: 1000,
      })

      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }

      allReviews.docs.forEach((review: any) => {
        const rating = review?.rating
        if (rating && rating >= 1 && rating <= 5) {
          ratingDistribution[rating as keyof typeof ratingDistribution]++
        }
      })

      // Format response
      const response = {
        reviews: reviews.docs.map((review: any) => ({
          id: review.id,
          rating: review.rating || 0,
          title: review.title || '',
          comment: review.comment || '',
          createdAt: review.createdAt || '',
          user: review.user
            ? {
                id: review.user.id || '',
                name: review.user.name || '',
                email: review.user.email || '',
              }
            : null,
          verifiedPurchase: review.verifiedPurchase || false,
          helpful: review.helpful || 0,
          images: review.images || null,
          status: review.status || 'pending',
          adminResponse: review.adminResponse || null,
        })),
        pagination: {
          page: reviews.page || 1,
          limit: reviews.limit || 10,
          totalPages: reviews.totalPages || 1,
          totalDocs: reviews.totalDocs || 0,
          hasNextPage: reviews.hasNextPage || false,
          hasPrevPage: reviews.hasPrevPage || false,
        },
        stats: {
          averageRating: product.averageRating || 0,
          totalReviews: product.reviewCount || 0,
          ratingDistribution,
        },
      }

      return Response.json({
        success: true,
        data: response,
      })
    } catch (error: unknown) {
      console.error('Error fetching product reviews:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch reviews',
        },
        { status: 500 },
      )
    }
  },
}
