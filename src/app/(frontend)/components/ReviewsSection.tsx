'use client'

import React, { useEffect, useState } from 'react'
import { ReviewDisplay } from './ReviewDisplay'
import { ReviewForm } from './ReviewForm'

interface ReviewsSectionProps {
  productId: string
  isAuthenticated: boolean
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ productId, isAuthenticated }) => {
  const [reviews, setReviews] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    averageRating: 0,
    totalReviews: 0,
    verifiedPurchases: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })
  const [pagination, setPagination] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchReviews = async (page: number = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/product-reviews?productId=${productId}&page=${page}&limit=10`,
        {
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()

      if (data.success) {
        if (page === 1) {
          setReviews(data.data.reviews)
        } else {
          setReviews((prev) => [...prev, ...data.data.reviews])
        }
        setStats(data.data.stats)
        setPagination(data.data.pagination)
        setCurrentPage(page)
      } else {
        throw new Error(data.error || 'Failed to fetch reviews')
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err)
      setError(err.message || 'Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(1)
  }, [productId])

  const handleLoadMore = () => {
    if (pagination?.hasNextPage) {
      fetchReviews(currentPage + 1)
    }
  }

  const handleReviewSubmitted = () => {
    // Refresh the reviews list after successful submission
    fetchReviews(1)
  }

  return (
    <div className="space-y-8">
      <div className="divider"></div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Review Form - Takes up 1 column */}
        <div className="lg:col-span-1">
          <ReviewForm
            productId={productId}
            isAuthenticated={isAuthenticated}
            onSuccess={handleReviewSubmitted}
          />
        </div>

        {/* Reviews Display - Takes up 2 columns */}
        <div className="lg:col-span-2">
          {error ? (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          ) : isLoading && reviews.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <ReviewDisplay
              reviews={reviews}
              stats={stats}
              onLoadMore={handleLoadMore}
              hasMore={pagination?.hasNextPage}
              isLoading={isLoading}
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>
      </div>
    </div>
  )
}
