import React from 'react'

/**
 * Skeleton loading placeholder for ProductCard
 * Matches the exact layout of ProductCard for seamless loading experience
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="card card-compact bg-base-100 border border-base-200 overflow-hidden h-full">
      {/* Image Skeleton */}
      <div className="skeleton w-full aspect-[4/5] rounded-b-none"></div>

      <div className="p-4 space-y-3">
        {/* Title Line */}
        <div className="skeleton h-4 w-3/4"></div>

        {/* Rating/Meta Line */}
        <div className="skeleton h-3 w-1/3"></div>

        {/* Price & Button Area */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex flex-col gap-1 w-1/2">
            <div className="skeleton h-5 w-16"></div>
            <div className="skeleton h-3 w-10"></div>
          </div>
          <div className="skeleton h-8 w-8 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Helper to calculate how many skeletons to show for infinite scroll
 * Fills the remaining columns in the current row + one full next row
 */
export function getSkeletonCount(productCount: number, columns: number = 4): number {
  const remainder = productCount % columns
  return remainder === 0 ? columns : columns - remainder + columns
}

export default ProductCardSkeleton
