import { Category } from '@/payload-types'
import React from 'react'

interface CategoryCardProps {
  category: Category
}

const getImageUrl = (image?: string | { url?: string } | null): string => {
  const placeholder = '/images/placeholder.jpg' // <- change to your placeholder path
  if (!image) return placeholder
  if (typeof image === 'string') return image
  // For Payload Media objects or your mock { url: '...' }
  return image.url ?? placeholder
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const imageSrc = getImageUrl(category.image as any)

  return (
    <a
      href={`/shop?category=${encodeURIComponent(category.slug)}`}
      className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer overflow-hidden relative
                 group-hover:ring-2 group-hover:ring-primary group-hover:ring-opacity-30"
    >
      <figure className="relative aspect-square">
        <img
          src={imageSrc}
          alt={category.name}
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
