import type { Endpoint, PayloadRequest } from 'payload'

export const getUserReview: Endpoint = {
  path: '/user-review',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    // Check authentication
    if (!user) {
      return Response.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 },
      )
    }

    try {
      if (!req.url) {
        return Response.json({ success: false, error: 'Invalid request URL' }, { status: 400 })
      }

      const url = new URL(req.url)
      const productId = url.searchParams.get('productId')

      if (!productId) {
        return Response.json({ success: false, error: 'Product ID is required' }, { status: 400 })
      }

      // Find user's review for this product
      const existingReviews = await payload.find({
        collection: 'reviews',
        where: {
          and: [{ product: { equals: productId } }, { user: { equals: user.id } }],
        },
        limit: 1,
      })

      if (existingReviews.docs && existingReviews.docs.length > 0) {
        const review = existingReviews.docs[0]

        return Response.json({
          success: true,
          data: {
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            status: review.status,
            verifiedPurchase: review.verifiedPurchase,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          },
        })
      }

      return Response.json({
        success: true,
        data: null,
      })
    } catch (error: unknown) {
      console.error('Error fetching user review:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch review',
        },
        { status: 500 },
      )
    }
  },
}
