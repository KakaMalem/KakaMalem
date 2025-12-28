'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const router = useRouter()
  const searchParams = useSearchParams()
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
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false)
  const hasAutoSubmitted = useRef(false)

  // Extract submission logic into a reusable function
  const submitReview = useCallback(
    async (reviewRating: number, reviewTitle: string, reviewComment: string) => {
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
                  rating: reviewRating,
                  title: reviewTitle.trim(),
                  comment: reviewComment.trim(),
                }
              : {
                  productId,
                  rating: reviewRating,
                  title: reviewTitle.trim(),
                  comment: reviewComment.trim(),
                },
          ),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error ||
              `خطا در ${isUpdate ? 'بروزرسانی' : 'ارسال'} نظریه. لطفا دوباره تلاش کنید.`,
          )
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
        toast.success(
          isUpdate ? 'نظریه شما با موفقیت بروزرسانی شد!' : 'نظریه شما با موفقیت ثبت شد!',
        )

        // Clear form
        setRating(0)
        setTitle('')
        setComment('')

        if (onSuccess) {
          onSuccess()
        }
      } catch (error: unknown) {
        console.error('خطا در ثبت نظریه:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'خطا در ثبت نظریه. لطفا دوباره تلاش کنید.'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [userReview, isEditing, productId, onSuccess],
  )

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

  // Check for pending review from sessionStorage (after login redirect)
  useEffect(() => {
    // Only run if authenticated
    if (isAuthenticated !== true) {
      return
    }

    const submitAfterLogin = searchParams.get('submitReview')

    // Check if we should auto-submit
    if (submitAfterLogin === 'true' && !hasAutoSubmitted.current && !isLoadingReview) {
      const pendingReviewKey = `pendingReview_${productId}`
      const pendingReviewData = sessionStorage.getItem(pendingReviewKey)

      if (pendingReviewData) {
        try {
          const reviewData = JSON.parse(pendingReviewData)

          // Mark as submitted immediately to prevent duplicate submissions
          hasAutoSubmitted.current = true
          setIsAutoSubmitting(true)

          // Clear from storage immediately
          sessionStorage.removeItem(pendingReviewKey)

          // Show notification that we're auto-submitting
          toast.loading('در حال ارسال نظریه شما...', { duration: 2000 })

          // Populate form with stored data first
          setRating(reviewData.rating)
          setTitle(reviewData.title)
          setComment(reviewData.comment)

          // Auto-submit the review after a brief delay to ensure state is updated
          setTimeout(async () => {
            try {
              await submitReview(reviewData.rating, reviewData.title, reviewData.comment)
              setIsAutoSubmitting(false)
            } catch (error) {
              console.error('خطا در ارسال خودکار نظریه:', error)
              toast.error('خطا در ارسال خودکار نظریه. لطفا دکمه ارسال را فشار دهید.')
              setIsAutoSubmitting(false)
              // Keep data in form so user can manually submit
              setRating(reviewData.rating)
              setTitle(reviewData.title)
              setComment(reviewData.comment)
            }
          }, 800)
        } catch (error) {
          console.error('خطا در بازیابی اطلاعات نظریه:', error)
          sessionStorage.removeItem(pendingReviewKey)
          toast.error('خطا در بازیابی اطلاعات نظریه. لطفا دوباره وارد کنید.')
        }
      } else {
        // If submitReview param exists but no data, clean up the URL
        if (submitAfterLogin === 'true') {
          const url = new URL(window.location.href)
          url.searchParams.delete('submitReview')
          window.history.replaceState({}, '', url.pathname + url.search)
        }
      }
    }
  }, [isAuthenticated, searchParams, productId, submitReview, isLoadingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form fields first
    if (rating === 0) {
      setError('لطفاً امتیاز را انتخاب کنید')
      toast.error('لطفاً امتیاز را انتخاب کنید')
      return
    }

    if (title.trim().length === 0) {
      setError('لطفاً عنوان نظریه را وارد کنید')
      toast.error('لطفاً عنوان نظریه را وارد کنید')
      return
    }

    if (comment.trim().length === 0) {
      setError('لطفاً متن نظریه را وارد کنید')
      toast.error('لطفاً متن نظریه را وارد کنید')
      return
    }

    // If not authenticated, store review data and redirect to login
    if (isAuthenticated !== true) {
      const pendingReviewKey = `pendingReview_${productId}`
      const reviewData = {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        timestamp: Date.now(),
      }

      try {
        // Store in sessionStorage
        sessionStorage.setItem(pendingReviewKey, JSON.stringify(reviewData))

        // Verify storage worked
        const stored = sessionStorage.getItem(pendingReviewKey)
        if (!stored) {
          throw new Error('خطا در ذخیره اطلاعات')
        }

        // Get current URL for return redirect
        const currentPath = window.location.pathname
        const currentSearch = window.location.search
        const baseUrl = currentPath + (currentSearch ? currentSearch : '')
        const separator = currentSearch ? '&' : '?'
        const fullUrl = `${baseUrl}${separator}submitReview=true`
        const redirectUrl = encodeURIComponent(fullUrl)

        // Show toast notification
        toast.success('نظریه شما ذخیره شد! لطفاً وارد شوید تا نظریه ارسال شود.', {
          duration: 3000,
          icon: '🔐',
        })

        // Redirect to login with return URL
        setTimeout(() => {
          router.push(`/auth/login?redirect=${redirectUrl}`)
        }, 800)
      } catch (error) {
        console.error('خطا در ذخیره نظریه:', error)
        toast.error('خطا در ذخیره اطلاعات. لطفا دوباره تلاش کنید.')
        setError('خطا در ذخیره اطلاعات. لطفا دوباره تلاش کنید.')
      }

      return
    }

    // Call the submission function
    await submitReview(rating, title, comment)
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
        throw new Error(data.error || 'خطا در حذف نظریه')
      }

      toast.success('نظریه شما با موفقیت حذف شد!')
      setUserReview(null)
      setShowDeleteConfirm(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error: unknown) {
      console.error('خطا در حذف نظریه:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'خطا در حذف نظریه. لطفا دوباره تلاش کنید.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingReview && isAuthenticated) {
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
      <div className="card bg-base-100 border border-base-300 p-6" dir="rtl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold">نظریه شما</h3>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="btn btn-sm btn-ghost"
              aria-label="ویرایش نظریه"
              title="ویرایش نظریه"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-sm btn-ghost text-error"
              aria-label="حذف نظریه"
              title="حذف نظریه"
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
                    star <= userReview.rating ? 'fill-rating text-rating' : 'text-base-300'
                  }`}
                />
              ))}
            </div>
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
              ارسال شده در{' '}
              {new Date(userReview.createdAt).toLocaleDateString('en-US').replace(/\d{4}/, '2025')}
              {userReview.updatedAt &&
                userReview.updatedAt !== userReview.createdAt &&
                ` • ویرایش شده در ${new Date(userReview.updatedAt).toLocaleDateString('en-US').replace(/\d{4}/, '2025')}`}
            </p>
            {userReview.status === 'pending' && (
              <p className="text-warning mt-1">نظریه شما در انتظار تایید است</p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-error/10 border border-error rounded-lg">
            <p className="font-semibold mb-3">
              آیا مطمئن هستید که می‌خواهید نظریه خود را حذف کنید؟
            </p>
            <p className="text-sm text-base-content/70 mb-4">این عملیات قابل بازگشت نیست.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="btn btn-error btn-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    در حال حذف...
                  </>
                ) : (
                  'بله، حذف شود'
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
                className="btn btn-ghost btn-sm"
              >
                انصراف
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
    <div className="card bg-base-100 border border-base-300 p-6" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{isEditing ? 'ویرایش نظریه شما' : 'نوشتن نظریه'}</h3>
        {isEditing && (
          <button onClick={handleCancelEdit} className="btn btn-sm btn-ghost" aria-label="انصراف">
            <X className="w-4 h-4" />
            انصراف
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div className="fieldset">
          <label className="label">
            <span className="label-text font-semibold">
              امتیاز <span className="text-error">*</span>
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
                aria-label={`امتیاز ${star} ستاره`}
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating) ? 'fill-rating text-rating' : 'text-base-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="mr-2 text-sm opacity-70">
                {rating} {rating === 1 ? 'ستاره' : 'ستاره'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="fieldset">
          <label className="label">
            <span className="label-text font-semibold">
              عنوان نظریه <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-60">{title.length}/100</span>
          </label>
          <input
            type="text"
            placeholder="نظریه خود را در یک خط خلاصه کنید"
            className="input w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            required
          />
        </div>

        {/* Comment */}
        <div className="fieldset">
          <label className="label">
            <span className="label-text font-semibold">
              نظریه شما <span className="text-error">*</span>
            </span>
            <span className="label-text-alt opacity-60">{comment.length}/2000</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            placeholder="نظریه خود را درباره این محصول بنویسید..."
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

        {/* Auto-submit indicator */}
        {isAutoSubmitting && (
          <div className="alert alert-info">
            <div className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span>در حال ارسال خودکار نظریه شما...</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="fieldset">
          <button
            type="submit"
            disabled={
              isSubmitting || isAutoSubmitting || rating === 0 || !title.trim() || !comment.trim()
            }
            className="btn btn-primary"
          >
            {isSubmitting || isAutoSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {isEditing ? 'در حال بروزرسانی...' : 'در حال ارسال...'}
              </>
            ) : isEditing ? (
              'بروزرسانی نظریه'
            ) : (
              'ارسال نظریه'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
