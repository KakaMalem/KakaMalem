import React from 'react'

interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'sm' }) => {
  // Round to nearest 0.5
  const roundedRating = Math.round(rating * 2) / 2

  const sizeClass = size === 'lg' ? 'rating-lg' : size === 'md' ? 'rating-md' : 'rating-sm'

  return (
    <div
      className={`rating rating-half ${sizeClass}`}
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => {
        const isHalf = value % 1 !== 0
        const isFilled = value <= roundedRating

        return (
          <div
            key={value}
            className={`mask mask-star-2 ${isHalf ? 'mask-half-1' : 'mask-half-2'} ${isFilled ? 'bg-rating' : 'bg-rating-empty'}`}
            aria-label={`${value} star`}
            aria-current={value === roundedRating ? 'true' : undefined}
          />
        )
      })}
    </div>
  )
}
