import { Category } from '@/payload-types'
import Image from 'next/image'
import React from 'react'

interface CategoryCardProps {
  category: Category
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const categoryImage = category.categoryImage || category.image
  const imageSrc =
    typeof categoryImage === 'string'
      ? categoryImage
      : typeof categoryImage === 'object' && categoryImage?.url
        ? categoryImage.url
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'

  return (
    <a
      href={`/shop?category=${encodeURIComponent(category.slug)}`}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>

        {/* centered category name */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h3 className="text-2xl font-bold text-white drop-shadow-md">{category.name}</h3>
        </div>
      </figure>
    </a>
  )
}
