import type { Endpoint, PayloadRequest } from 'payload'

export const markHelpful: Endpoint = {
  path: '/mark-review-helpful',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    try {
      const body = await req.json?.()
      const { reviewId, helpful } = body || {}

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

      // Validate helpful value
      if (typeof helpful !== 'boolean') {
        return Response.json(
          {
            success: false,
            error: 'Helpful value must be a boolean',
          },
          { status: 400 },
        )
      }

      // User must be authenticated to vote
      if (!user?.id) {
        return Response.json(
          {
            success: false,
            error: 'You must be logged in to vote on reviews',
          },
          { status: 401 },
        )
      }

      const userId = user.id

      // Fetch the review
      let review: any
      try {
        review = await payload.findByID({
          collection: 'reviews',
          id: reviewId,
        })
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: 'Review not found',
          },
          { status: 404 },
        )
      }

      // Get existing votes
      const helpfulVotes = (review.helpfulVotes || []) as Array<{
        user: any
        votedAt?: string
        id?: string
      }>
      const notHelpfulVotes = (review.notHelpfulVotes || []) as Array<{
        user: any
        votedAt?: string
        id?: string
      }>

      // Helper function to get user ID from vote (handles both string and populated object)
      const getUserId = (vote: any): string => {
        if (typeof vote.user === 'string') return vote.user
        return vote.user?.id || vote.user
      }

      // Check if user already voted
      const hasVotedHelpful = helpfulVotes.some((v) => getUserId(v) === userId)
      const hasVotedNotHelpful = notHelpfulVotes.some((v) => getUserId(v) === userId)

      let newHelpfulVotes: Array<{ user: any; votedAt?: string; id?: string }> = [...helpfulVotes]
      let newNotHelpfulVotes: Array<{ user: any; votedAt?: string; id?: string }> = [
        ...notHelpfulVotes,
      ]

      if (helpful) {
        // User wants to mark as helpful
        if (hasVotedHelpful) {
          // Remove helpful vote (toggle off)
          newHelpfulVotes = helpfulVotes.filter((v) => getUserId(v) !== userId)
        } else {
          // Add helpful vote with timestamp
          newHelpfulVotes.push({ user: userId, votedAt: new Date().toISOString() })
          // Remove not helpful vote if exists
          if (hasVotedNotHelpful) {
            newNotHelpfulVotes = notHelpfulVotes.filter((v) => getUserId(v) !== userId)
          }
        }
      } else {
        // User wants to mark as not helpful
        if (hasVotedNotHelpful) {
          // Remove not helpful vote (toggle off)
          newNotHelpfulVotes = notHelpfulVotes.filter((v) => getUserId(v) !== userId)
        } else {
          // Add not helpful vote with timestamp
          newNotHelpfulVotes.push({ user: userId, votedAt: new Date().toISOString() })
          // Remove helpful vote if exists
          if (hasVotedHelpful) {
            newHelpfulVotes = helpfulVotes.filter((v) => getUserId(v) !== userId)
          }
        }
      }

      // Calculate new helpful count (only count helpful votes)
      const newHelpfulCount = newHelpfulVotes.length

      // Update the review
      await payload.update({
        collection: 'reviews',
        id: reviewId,
        data: {
          helpful: newHelpfulCount,
          helpfulVotes: newHelpfulVotes,
          notHelpfulVotes: newNotHelpfulVotes,
        },
      })

      return Response.json({
        success: true,
        data: {
          helpful: newHelpfulCount,
          userVote: newHelpfulVotes.some((v) => v.user === userId)
            ? 'helpful'
            : newNotHelpfulVotes.some((v) => v.user === userId)
              ? 'not-helpful'
              : null,
        },
      })
    } catch (error: unknown) {
      console.error('Error marking review as helpful:', error)
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
