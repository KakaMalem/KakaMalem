import { Category } from '@/payload-types'
import Image from 'next/image'
import React from 'react'

interface CategoryCardProps {
  category: Category
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const smallCategoryImage = category.smallCategoryImage
  const imageSrc =
    typeof smallCategoryImage === 'string'
      ? smallCategoryImage
      : typeof smallCategoryImage === 'object' && smallCategoryImage?.url
        ? smallCategoryImage.url
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

  return (
    <a
      href={`/category/${category.slug}`}
      className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden relative
                 group-hover:ring-2 group-hover:ring-primary group-hover:ring-opacity-30"
    >
      <figure className="relative aspect-square">
        <Image
          src={imageSrc}
          alt={category.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* subtle dark gradient to improve text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral/80 via-neutral/50 to-transparent"></div>

        {/* centered category name */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-2xl font-bold text-neutral-content drop-shadow-md">
            {category.name}
          </h3>
        </div>
      </figure>
    </a>
  )
}
