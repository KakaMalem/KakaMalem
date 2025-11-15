'use client'

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { StarRating } from './StarRating'

interface ReviewUser {
  id: string
  name?: string
  email?: string
}

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  createdAt: string
  user: ReviewUser | string
  verifiedPurchase?: boolean
  helpful?: number
  images?: any
  status?: string
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
}

const RatingDistribution = ({ stats }: { stats: ReviewStats }) => {
  const { ratingDistribution, totalReviews } = stats

  return (
    <div className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = ratingDistribution[stars as keyof typeof ratingDistribution] || 0
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

        return (
          <div key={stars} className="flex items-center gap-2">
            <span className="text-sm w-8">{stars} ★</span>
            <div className="flex-1 bg-base-300 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-400 h-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm w-12 text-right opacity-70">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

const ReviewCard = ({ review }: { review: Review }) => {
  const user = typeof review.user === 'object' ? review.user : null
  const userName = user?.name || user?.email?.split('@')[0] || 'Anonymous'
  const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

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

      {review.helpful && review.helpful > 0 && (
        <div className="mt-4 text-sm opacity-60">
          {review.helpful} {review.helpful === 1 ? 'person' : 'people'} found this helpful
        </div>
      )}
    </div>
  )
}

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  reviews,
  stats,
  onLoadMore,
  hasMore,
  isLoading,
}) => {
  if (stats.totalReviews === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg opacity-60">No reviews yet</p>
        <p className="text-sm opacity-40 mt-2">Be the first to review this product!</p>
      </div>
    )
  }

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
          <RatingDistribution stats={stats} />
        </div>
      </div>

      <div className="divider"></div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Customer Reviews</h3>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
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
