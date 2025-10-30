// components/ProductCard.tsx
import React from 'react'
import Link from 'next/link'
import { ShoppingCart, Heart } from 'lucide-react'
import { Product } from '@/payload-types'

interface ProductCardProps {
  product: Product
  size?: 'normal' | 'compact'
}

const placeholderImage = '/images/placeholder.jpg'

const getMediaUrl = (media?: string | { url?: string } | any): string => {
  if (!media) return placeholderImage
  if (typeof media === 'string') return media
  return media.url ?? media.data?.url ?? placeholderImage
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, size = 'normal' }) => {
  const price: number = typeof product.price === 'number' ? product.price : 0
  const salePrice: number | undefined =
    typeof product.salePrice === 'number' ? product.salePrice : undefined
  const hasDiscount = typeof salePrice === 'number' && salePrice < price && price > 0
  const discount = hasDiscount ? Math.round(((price - (salePrice as number)) / price) * 100) : 0

  const imgUrl = getMediaUrl(product.images?.[0]?.image)
  const avgRating = typeof product.averageRating === 'number' ? product.averageRating : 0
  const reviewCount = typeof product.reviewCount === 'number' ? product.reviewCount : 0

  // Ensure slug exists — if not, fallback to id
  const slug = product.slug ?? product.id

  return (
    <article className="card bg-base-100 shadow-lg hover:shadow-2xl transition-all duration-300 group">
      {/* clickable image -> product page */}
      <Link href={`/shop/${slug}`} className="block">
        <figure className="relative overflow-hidden aspect-square">
          <img
            src={imgUrl}
            alt={product.images?.[0]?.alt ?? product.name ?? 'Product'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {hasDiscount && (
            <div className="badge badge-primary absolute top-3 left-3 font-bold">-{discount}%</div>
          )}
        </figure>
      </Link>

      <div className="card-body p-4">
        {/* clickable title */}
        <h3 className="card-title text-base group-hover:text-primary transition-colors line-clamp-2">
          <Link href={`/product/${slug}`} className="inline-block">
            {product.name}
          </Link>
        </h3>

        {product.shortDescription && size === 'normal' && (
          <p className="text-sm opacity-70 line-clamp-2">{product.shortDescription}</p>
        )}

        {avgRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="rating rating-sm" aria-hidden>
              {[...Array(5)].map((_, i) => (
                <input
                  key={i}
                  type="radio"
                  className={`mask mask-star-2 ${i < Math.floor(avgRating) ? 'bg-accent' : 'bg-base-300'}`}
                  disabled
                />
              ))}
            </div>
            <span className="text-xs opacity-60">({reviewCount})</span>
          </div>
        )}

        <div className="card-actions justify-between items-center mt-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">${salePrice}</span>
                <span className="text-sm opacity-60 line-through">${price}</span>
              </div>
            ) : (
              <span className="text-xl font-bold">${price}</span>
            )}
          </div>

          {/* keep Add to cart button (does not navigate away) */}
          <button className="btn btn-primary btn-sm" aria-label="Add to cart">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
