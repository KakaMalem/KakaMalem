'use client'

import React, { useState } from 'react'
import { CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { StarRating } from './StarRating'
import type { Review as PayloadReview } from '@/payload-types'

interface Review extends Omit<PayloadReview, 'user'> {
  user: { id: string; name?: string; email?: string } | string
  userVote?: 'helpful' | 'not-helpful' | null
}

interface ReviewStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface ReviewDisplayProps {
  reviews: Review[]
  stats: ReviewStats
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  isAuthenticated?: boolean
}

const RatingDistribution = ({
  stats,
  selectedRating,
  onRatingClick,
}: {
  stats: ReviewStats
  selectedRating: number | null
  onRatingClick: (rating: number | null) => void
}) => {
  const { ratingDistribution, totalReviews } = stats

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
        const isSelected = selectedRating === stars

        return (
          <button
            key={stars}
            onClick={() => onRatingClick(isSelected ? null : stars)}
            className={`flex items-center gap-2 w-full hover:bg-base-200 rounded px-2 py-1 transition-colors ${
              isSelected ? 'bg-base-200 ring-2 ring-primary' : ''
            }`}
            disabled={count === 0}
          >
            <span className="text-sm w-8">{stars} ★</span>
            <div className="flex-1 bg-base-300 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-400 h-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm w-12 text-right opacity-70">{count}</span>
          </button>
        )
      })}
    </div>
  )
}

const ReviewCard = ({ review, isAuthenticated }: { review: Review; isAuthenticated?: boolean }) => {
  const user = typeof review.user === 'object' ? review.user : null
  const userName = user?.name || user?.email?.split('@')[0] || 'Anonymous'
  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const [helpfulCount, setHelpfulCount] = useState(review.helpful || 0)
  const [isVoting, setIsVoting] = useState(false)
  const [userVote, setUserVote] = useState<'helpful' | 'not-helpful' | null>(
    review.userVote || null,
  )

  const handleVote = async (helpful: boolean) => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const currentPath = window.location.pathname
      window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`
      return
    }

    if (isVoting) return

    setIsVoting(true)
    try {
      const response = await fetch('/api/mark-review-helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          helpful,
        }),
      })

      if (!response.ok) throw new Error('Failed to vote')

      const data = await response.json()
      setHelpfulCount(data.data.helpful)
      setUserVote(data.data.userVote)
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="avatar avatar-placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span className="text-sm">{userName.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold">{userName}</p>
              <p className="text-xs opacity-60">{reviewDate}</p>
            </div>
            {review.verifiedPurchase && (
              <div className="badge badge-success badge-sm gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified Purchase
              </div>
            )}
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      <h4 className="font-bold text-lg mb-2">{review.title}</h4>
      <p className="text-base-content/80 whitespace-pre-wrap">{review.comment}</p>

      <div className="mt-4 flex items-center gap-4">
        <p className="text-sm opacity-60">Was this review helpful?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVote(true)}
            disabled={isVoting}
            className={`btn btn-sm btn-ghost gap-1 ${userVote === 'helpful' ? 'btn-active text-success' : ''}`}
            aria-label="Mark as helpful"
          >
            <ThumbsUp className="w-4 h-4" />
            {userVote === 'helpful' && <span className="text-xs">({helpfulCount})</span>}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={isVoting}
            className={`btn btn-sm btn-ghost gap-1 ${userVote === 'not-helpful' ? 'btn-active text-error' : ''}`}
            aria-label="Mark as not helpful"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
        {helpfulCount > 0 && userVote !== 'helpful' && (
          <span className="text-sm opacity-60">
            {helpfulCount} {helpfulCount === 1 ? 'person' : 'people'} found this helpful
          </span>
        )}
      </div>
    </div>
  )
}

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  reviews,
  stats,
  onLoadMore,
  hasMore,
  isLoading,
  isAuthenticated,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)

  if (stats.totalReviews === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg opacity-60">No reviews yet</p>
        <p className="text-sm opacity-40 mt-2">Be the first to review this product!</p>
      </div>
    )
  }

  // Filter reviews by selected rating
  const filteredReviews = selectedRating
    ? reviews.filter((review) => review.rating === selectedRating)
    : reviews

  return (
    <div className="space-y-8">
      {/* Overall Rating Summary */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-primary mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating rating={stats.averageRating} />
          <p className="text-sm opacity-60 mt-2">
            Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div>
          <RatingDistribution
            stats={stats}
            selectedRating={selectedRating}
            onRatingClick={setSelectedRating}
          />
        </div>
      </div>

      <div className="divider"></div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Customer Reviews</h3>
          {selectedRating && (
            <button
              onClick={() => setSelectedRating(null)}
              className="btn btn-sm btn-ghost gap-2"
            >
              <span>Showing {selectedRating} ★ reviews</span>
              <span className="text-lg">×</span>
            </button>
          )}
        </div>
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review) => (
            <ReviewCard key={review.id} review={review} isAuthenticated={isAuthenticated} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-base opacity-60">No {selectedRating} star reviews yet</p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center">
          <button onClick={onLoadMore} disabled={isLoading} className="btn btn-outline btn-primary">
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Loading...
              </>
            ) : (
              'Load More Reviews'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
