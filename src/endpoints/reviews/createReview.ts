import type { Endpoint, PayloadRequest } from 'payload'
import { checkVerifiedPurchase } from '../../hooks/verifyPurchase'

export const createReview: Endpoint = {
  path: '/create-review',
  method: 'post',
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
      const body = await req.json?.()
      const { productId, rating, title, comment, images } = body || {}

      // Validate product ID
      if (!productId || typeof productId !== 'string') {
        return Response.json(
          {
            success: false,
            error: 'Product ID is required',
          },
          { status: 400 },
        )
      }

      // Validate rating
      if (
        !rating ||
        typeof rating !== 'number' ||
        rating < 1 ||
        rating > 5 ||
        !Number.isInteger(rating)
      ) {
        return Response.json(
          {
            success: false,
            error: 'Rating must be an integer between 1 and 5',
          },
          { status: 400 },
        )
      }

      // Validate title
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return Response.json(
          {
            success: false,
            error: 'Review title is required',
          },
          { status: 400 },
        )
      }

      if (title.length > 100) {
        return Response.json(
          {
            success: false,
            error: 'Title must be 100 characters or less',
          },
          { status: 400 },
        )
      }

      // Validate comment
      if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
        return Response.json(
          {
            success: false,
            error: 'Review comment is required',
          },
          { status: 400 },
        )
      }

      if (comment.length > 2000) {
        return Response.json(
          {
            success: false,
            error: 'Comment must be 2000 characters or less',
          },
          { status: 400 },
        )
      }

      // Verify product exists
      try {
        await payload.findByID({
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

      // Check if user already reviewed this product
      const existingReviews = await payload.find({
        collection: 'reviews',
        where: {
          and: [{ product: { equals: productId } }, { user: { equals: user.id } }],
        },
      })

      if (existingReviews.docs && existingReviews.docs.length > 0) {
        return Response.json(
          {
            success: false,
            error: 'You have already reviewed this product',
          },
          { status: 400 },
        )
      }

      // Check if user has purchased this product (for verified purchase badge)
      const verifiedPurchase = await checkVerifiedPurchase(payload, user.id, productId)

      // Create the review
      const review = await payload.create({
        collection: 'reviews',
        data: {
          product: productId,
          user: user.id,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          status: 'approved',
          verifiedPurchase,
          helpful: 0,
          ...(images && { images }),
        },
      })

      // Format response
      const response = {
        id: review.id,
        status: review.status || 'pending',
        verifiedPurchase: review.verifiedPurchase || false,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt,
      }

      return Response.json(
        {
          success: true,
          message: 'Review submitted successfully!',
          data: response,
        },
        { status: 201 },
      )
    } catch (error: unknown) {
      console.error('Error creating review:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to submit review',
        },
        { status: 500 },
      )
    }
  },
}
