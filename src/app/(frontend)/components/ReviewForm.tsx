'use client'

import React, { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewFormProps {
  productId: string
  onSuccess?: () => void
  isAuthenticated: boolean
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onSuccess,
  isAuthenticated,
}) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      setError('You must be logged in to submit a review')
      return
    }

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (title.trim().length === 0) {
      setError('Please enter a review title')
      return
    }

    if (comment.trim().length === 0) {
      setError('Please enter a review comment')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/create-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review')
      }

      // Success
      setSuccess(true)
      setRating(0)
      setTitle('')
      setComment('')

      if (onSuccess) {
        onSuccess()
      }

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (error: any) {
      console.error('Error submitting review:', error)
      setError(error.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="card bg-base-200 p-6 text-center">
        <p className="mb-4">You must be logged in to write a review</p>
        <a href="/auth/login" className="btn btn-primary">
          Log In
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="alert alert-success">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 className="font-bold">Review submitted successfully!</h3>
          <p className="text-sm">Your review is now visible to other customers.</p>
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="btn btn-sm btn-ghost"
          aria-label="Write another review"
        >
          Write another review
        </button>
      </div>
    )
  }

  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <h3 className="text-xl font-bold mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Your Rating <span className="text-error">*</span>
            </span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-orange-400 text-orange-400'
                      : 'text-base-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm opacity-70">
                {rating} {rating === 1 ? 'star' : 'stars'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Review Title <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-60">{title.length}/100</span>
          </label>
          <input
            type="text"
            placeholder="Sum up your review in one line"
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            required
          />
        </div>

        {/* Comment */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">
              Your Review <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-60">{comment.length}/2000</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            placeholder="Share your thoughts about this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            maxLength={2000}
            required
          />
        </div>

        {/* Error Message */}
        {error && (
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
        )}

        {/* Submit Button */}
        <div className="form-control">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !title.trim() || !comment.trim()}
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
