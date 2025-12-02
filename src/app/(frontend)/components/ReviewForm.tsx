'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Edit, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: string
  onSuccess?: () => void
  isAuthenticated: boolean
}

interface UserReview {
  id: string
  rating: number
  title: string
  comment: string
  status: string
  verifiedPurchase: boolean
  createdAt: string
  updatedAt?: string
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
  const [userReview, setUserReview] = useState<UserReview | null>(null)
  const [isLoadingReview, setIsLoadingReview] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Fetch user's existing review
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingReview(false)
      return
    }

    const fetchUserReview = async () => {
      setIsLoadingReview(true)
      try {
        const response = await fetch(`/api/user-review?productId=${productId}`, {
          credentials: 'include',
        })

        const data = await response.json()

        if (response.ok && data.success && data.data) {
          setUserReview(data.data)
        }
      } catch (error) {
        console.error('Error fetching user review:', error)
      } finally {
        setIsLoadingReview(false)
      }
    }

    fetchUserReview()
  }, [productId, isAuthenticated])

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
      const isUpdate = userReview && isEditing

      const response = await fetch(isUpdate ? '/api/update-review' : '/api/create-review', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(
          isUpdate
            ? {
                reviewId: userReview.id,
                rating,
                title: title.trim(),
                comment: comment.trim(),
              }
            : {
                productId,
                rating,
                title: title.trim(),
                comment: comment.trim(),
              },
        ),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isUpdate ? 'update' : 'submit'} review`)
      }

      // Success - update local state
      const updatedReview: UserReview = {
        id: data.data.id || userReview?.id || '',
        rating: data.data.rating,
        title: data.data.title,
        comment: data.data.comment,
        status: data.data.status,
        verifiedPurchase: data.data.verifiedPurchase || userReview?.verifiedPurchase || false,
        createdAt: data.data.createdAt || userReview?.createdAt || new Date().toISOString(),
        updatedAt: data.data.updatedAt,
      }

      setUserReview(updatedReview)
      setIsEditing(false)
      toast.success(data.message || `Review ${isUpdate ? 'updated' : 'submitted'} successfully!`)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      console.error('Error with review:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = () => {
    if (!userReview) return

    setRating(userReview.rating)
    setTitle(userReview.title)
    setComment(userReview.comment)
    setIsEditing(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setRating(0)
    setTitle('')
    setComment('')
    setError(null)
  }

  const handleDelete = async () => {
    if (!userReview) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/delete-review?reviewId=${userReview.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review')
      }

      toast.success('Review deleted successfully!')
      setUserReview(null)
      setShowDeleteConfirm(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      console.error('Error deleting review:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete review. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="card bg-base-200 p-6 text-center">
        <p className="mb-4">You must be logged in to write a review</p>
        <Link href="/auth/login" className="btn btn-primary">
          Log In
        </Link>
      </div>
    )
  }

  if (isLoadingReview) {
    return (
      <div className="card bg-base-100 border border-base-300 p-6">
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </div>
    )
  }

  // Show existing review (not in edit mode)
  if (userReview && !isEditing) {
    return (
      <div className="card bg-base-100 border border-base-300 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold">Your Review</h3>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="btn btn-sm btn-ghost"
              aria-label="Edit review"
              title="Edit review"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-sm btn-ghost text-error"
              aria-label="Delete review"
              title="Delete review"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= userReview.rating ? 'fill-orange-400 text-orange-400' : 'text-base-300'
                  }`}
                />
              ))}
            </div>
            {userReview.verifiedPurchase && (
              <span className="badge badge-success badge-sm">Verified Purchase</span>
            )}
          </div>

          {/* Title */}
          <div>
            <h4 className="font-semibold text-lg">{userReview.title}</h4>
          </div>

          {/* Comment */}
          <div>
            <p className="text-base-content/80 whitespace-pre-wrap">{userReview.comment}</p>
          </div>

          {/* Metadata */}
          <div className="text-sm text-base-content/60 pt-2 border-t border-base-300">
            <p>
              Posted on {new Date(userReview.createdAt).toLocaleDateString()}
              {userReview.updatedAt &&
                userReview.updatedAt !== userReview.createdAt &&
                ` • Edited on ${new Date(userReview.updatedAt).toLocaleDateString()}`}
            </p>
            {userReview.status === 'pending' && (
              <p className="text-warning mt-1">Your review is pending approval</p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-error/10 border border-error rounded-lg">
            <p className="font-semibold mb-3">Are you sure you want to delete your review?</p>
            <p className="text-sm text-base-content/70 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="btn btn-error btn-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-error text-sm mt-2">{error}</p>}
          </div>
        )}
      </div>
    )
  }

  // Show form (new review or editing existing)
  return (
    <div className="card bg-base-100 border border-base-300 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{isEditing ? 'Edit Your Review' : 'Write a Review'}</h3>
        {isEditing && (
          <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost" aria-label="Cancel">
            <X className="w-4 h-4" />
            Cancel
          </button>
        )}
      </div>

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
                {isEditing ? 'Updating...' : 'Submitting...'}
              </>
            ) : isEditing ? (
              'Update Review'
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
