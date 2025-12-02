import type { Endpoint, PayloadRequest } from 'payload'

export const deleteReview: Endpoint = {
  path: '/delete-review',
  method: 'delete',
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
      const reviewId = url.searchParams.get('reviewId')

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

      // Check if review belongs to user (or if user is admin)
      const reviewUserId =
        typeof existingReview.user === 'string' ? existingReview.user : existingReview.user?.id

      const isAdmin =
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')

      if (reviewUserId !== user.id && !isAdmin) {
        return Response.json(
          {
            success: false,
            error: 'You can only delete your own reviews',
          },
          { status: 403 },
        )
      }

      // Delete the review
      await payload.delete({
        collection: 'reviews',
        id: reviewId,
      })

      return Response.json(
        {
          success: true,
          message: 'Review deleted successfully!',
        },
        { status: 200 },
      )
    } catch (error: unknown) {
      console.error('Error deleting review:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to delete review',
        },
        { status: 500 },
      )
    }
  },
}
