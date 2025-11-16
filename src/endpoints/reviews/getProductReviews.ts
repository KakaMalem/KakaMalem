import type { Endpoint, PayloadRequest } from 'payload'

export const getProductReviews: Endpoint = {
  path: '/product-reviews',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    try {
      if (!req.url) {
        return Response.json({ success: false, error: 'Invalid request URL' }, { status: 400 })
      }

      const url = new URL(req.url)
      const productId = url.searchParams.get('productId')
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '10', 10)

      if (!productId) {
        return Response.json({ success: false, error: 'Product ID is required' }, { status: 400 })
      }

      if (page < 1 || limit < 1 || limit > 50) {
        return Response.json(
          { success: false, error: 'Invalid pagination parameters' },
          { status: 400 },
        )
      }

      // Get product
      const product = await payload
        .findByID({
          collection: 'products',
          id: productId,
        })
        .catch(() => null)

      if (!product) {
        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
      }

      // Fetch ALL approved reviews (no sort in query - we'll smart sort in JS)
      const reviewsResult = await payload.find({
        collection: 'reviews',
        where: {
          and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
        },
        limit: 1000,
        depth: 2,
      })

      const allReviews = reviewsResult.docs
      console.log(`[Reviews] Processing ${allReviews.length} reviews for smart sorting`)

      // ENHANCED SMART SORTING ALGORITHM
      const now = Date.now()

      // Calculate score for each review
      const scoredReviews = allReviews.map((review) => {
        let score = 0
        let scoreBreakdown: Record<string, number> = {} // For debugging

        // 1. RECENCY BOOST - New reviews get initial visibility
        const createdAt = new Date(review.createdAt).getTime()
        const ageHours = (now - createdAt) / (1000 * 60 * 60)

        if (ageHours < 24) {
          // First 24 hours - strong boost
          const recencyScore = ((24 - ageHours) / 24) * 3
          score += recencyScore
          scoreBreakdown.recency24h = recencyScore
        } else if (ageHours < 72) {
          // 24-72 hours - moderate boost
          const recencyScore = ((72 - ageHours) / 48) * 1.5
          score += recencyScore
          scoreBreakdown.recency72h = recencyScore
        } else if (ageHours < 168) {
          // Up to 1 week - small boost
          const recencyScore = ((168 - ageHours) / 96) * 0.5
          score += recencyScore
          scoreBreakdown.recencyWeek = recencyScore
        }

        // 2. ENGAGEMENT SCORE - Recent votes matter most
        const helpfulVotes = Array.isArray(review.helpfulVotes) ? review.helpfulVotes : []

        if (helpfulVotes.length > 0) {
          let engagementScore = 0

          helpfulVotes.forEach((vote: any) => {
            const voteTime = vote.votedAt ? new Date(vote.votedAt).getTime() : createdAt // Fallback to review creation if no votedAt

            const voteAgeHours = (now - voteTime) / (1000 * 60 * 60)

            // Exponential decay with 48-hour half-life
            const voteValue = Math.exp(-voteAgeHours / 48) * 2
            engagementScore += voteValue
          })

          score += engagementScore
          scoreBreakdown.engagement = engagementScore

          // Volume bonus (logarithmic to prevent gaming)
          const volumeBonus = Math.log10(helpfulVotes.length + 1) * 1.5
          score += volumeBonus
          scoreBreakdown.volume = volumeBonus
        }

        // 3. VERIFIED PURCHASE BONUS - Significant weight for verified buyers
        if (review.verifiedPurchase) {
          // Verified reviews get a substantial boost
          const verifiedBonus = 2.5
          score += verifiedBonus
          scoreBreakdown.verified = verifiedBonus

          // Extra boost for verified purchases with high ratings
          if (review.rating >= 4) {
            score += 0.5
            scoreBreakdown.verifiedHighRating = 0.5
          }
        }

        // 4. CONTENT QUALITY SIGNALS
        if (review.comment) {
          // Detailed reviews (>200 chars) get a boost
          if (review.comment.length > 200) {
            const qualityBonus = Math.min(review.comment.length / 500, 1) * 0.8
            score += qualityBonus
            scoreBreakdown.contentLength = qualityBonus
          }

          // Reviews with title get a small boost
          if (review.title && review.title.length > 10) {
            score += 0.3
            scoreBreakdown.hasTitle = 0.3
          }
        }

        // 5. RATING BALANCE - Slight boost for extreme ratings (very helpful to see)
        if (review.rating === 1 || review.rating === 5) {
          score += 0.4
          scoreBreakdown.extremeRating = 0.4
        }

        return {
          ...review,
          _score: score,
          _scoreBreakdown: scoreBreakdown, // For debugging
        }
      })

      // Sort by score (highest first)
      scoredReviews.sort((a, b) => {
        // Primary sort by score
        const scoreDiff = b._score - a._score
        if (Math.abs(scoreDiff) > 0.01) {
          return scoreDiff
        }

        // Secondary: Verified purchases win ties
        if (a.verifiedPurchase !== b.verifiedPurchase) {
          return b.verifiedPurchase ? 1 : -1
        }

        // Tertiary: Newer reviews win remaining ties
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[Smart Sort Results] Top 5 reviews:')
        scoredReviews.slice(0, 5).forEach((r, i) => {
          const age = Math.floor((now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          console.log(
            `  ${i + 1}. Score: ${r._score.toFixed(2)}, Verified: ${r.verifiedPurchase ? 'YES' : 'NO'}, Votes: ${r.helpfulVotes?.length || 0}, Age: ${age}d, Rating: ${r.rating}★`,
          )
          if (r._scoreBreakdown && Object.keys(r._scoreBreakdown).length > 0) {
            console.log(`     Breakdown:`, r._scoreBreakdown)
          }
        })
      }

      // Pagination
      const startIndex = (page - 1) * limit
      const paginatedReviews = scoredReviews.slice(startIndex, startIndex + limit)

      // Calculate statistics
      const totalDocs = scoredReviews.length
      const totalPages = Math.ceil(totalDocs / limit)

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      let verifiedCount = 0

      scoredReviews.forEach((review) => {
        const rating = Math.round(review.rating)
        if (rating >= 1 && rating <= 5) {
          ratingDistribution[rating]++
        }
        if (review.verifiedPurchase) {
          verifiedCount++
        }
      })

      // Format response
      const formattedReviews = paginatedReviews.map((review) => {
        const helpfulVotes = review.helpfulVotes || []
        const notHelpfulVotes = review.notHelpfulVotes || []

        // Check user's vote
        let userVote = null
        if (user?.id) {
          if (
            helpfulVotes.some((v: any) => {
              const userId = typeof v.user === 'string' ? v.user : v.user?.id
              return userId === user.id
            })
          ) {
            userVote = 'helpful'
          } else if (
            notHelpfulVotes.some((v: any) => {
              const userId = typeof v.user === 'string' ? v.user : v.user?.id
              return userId === user.id
            })
          ) {
            userVote = 'not-helpful'
          }
        }

        // Format user info
        const reviewUser = review.user
        const userData =
          typeof reviewUser === 'object' && reviewUser
            ? {
                id: reviewUser.id,
                name:
                  reviewUser.firstName && reviewUser.lastName
                    ? `${reviewUser.firstName} ${reviewUser.lastName}`
                    : reviewUser.firstName || reviewUser.lastName || 'Anonymous',
                email: reviewUser.email,
              }
            : null

        return {
          id: review.id,
          rating: review.rating,
          title: review.title || '',
          comment: review.comment || '',
          createdAt: review.createdAt,
          user: userData,
          verifiedPurchase: Boolean(review.verifiedPurchase),
          helpful: helpfulVotes.length,
          notHelpful: notHelpfulVotes.length,
          images: review.images || null,
          status: review.status,
          adminResponse: review.adminResponse || null,
          userVote,
        }
      })

      return Response.json({
        success: true,
        data: {
          reviews: formattedReviews,
          pagination: {
            page,
            limit,
            totalPages,
            totalDocs,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
          },
          stats: {
            averageRating: product.averageRating || 0,
            totalReviews: totalDocs,
            verifiedPurchases: verifiedCount,
            ratingDistribution,
          },
        },
      })
    } catch (error) {
      console.error('[getProductReviews] Error:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch reviews',
          ...(process.env.NODE_ENV === 'development' && {
            debug: error instanceof Error ? error.message : String(error),
          }),
        },
        { status: 500 },
      )
    }
  },
}
