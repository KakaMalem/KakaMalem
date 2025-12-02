import type { Endpoint, PayloadRequest } from 'payload'

export const updateReview: Endpoint = {
  path: '/update-review',
  method: 'put',
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
      const { reviewId, rating, title, comment } = body || {}

      // Validate review ID
      if (!reviewId || typeof reviewId !== 'string') {
        return Response.json(
          {
            success: false,
            error: 'Review ID is required',
          },
          { status: 400 },
        )
      }

      // Validate rating
      if (rating !== undefined) {
        if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
          return Response.json(
            {
              success: false,
              error: 'Rating must be an integer between 1 and 5',
            },
            { status: 400 },
          )
        }
      }

      // Validate title
      if (title !== undefined) {
        if (typeof title !== 'string' || title.trim().length === 0) {
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
      }

      // Validate comment
      if (comment !== undefined) {
        if (typeof comment !== 'string' || comment.trim().length === 0) {
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
      }

      // Verify review exists and belongs to user
      let existingReview
      try {
        existingReview = await payload.findByID({
          collection: 'reviews',
          id: reviewId,
        })
      } catch (_error) {
        return Response.json(
          {
            success: false,
            error: 'Review not found',
          },
          { status: 404 },
        )
      }

      // Check if review belongs to user
      const reviewUserId =
        typeof existingReview.user === 'string' ? existingReview.user : existingReview.user?.id

      if (reviewUserId !== user.id) {
        return Response.json(
          {
            success: false,
            error: 'You can only edit your own reviews',
          },
          { status: 403 },
        )
      }

      // Update the review
      const updatedReview = await payload.update({
        collection: 'reviews',
        id: reviewId,
        data: {
          ...(rating !== undefined && { rating }),
          ...(title !== undefined && { title: title.trim() }),
          ...(comment !== undefined && { comment: comment.trim() }),
        },
      })

      return Response.json(
        {
          success: true,
          message: 'Review updated successfully!',
          data: {
            id: updatedReview.id,
            rating: updatedReview.rating,
            title: updatedReview.title,
            comment: updatedReview.comment,
            status: updatedReview.status,
            updatedAt: updatedReview.updatedAt,
          },
        },
        { status: 200 },
      )
    } catch (error: unknown) {
      console.error('Error updating review:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to update review',
        },
        { status: 500 },
      )
    }
  },
}
