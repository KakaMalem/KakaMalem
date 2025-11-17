'use client'

import React from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { Product } from '@/payload-types'
import { ProductCard } from '@/app/(frontend)/components/ProductCard'

interface WishlistClientProps {
  products: Product[]
}

export default function WishlistClient({ products }: WishlistClientProps) {
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">My Wishlist</h2>
          <p className="text-base-content/70 mt-1">0 items</p>
        </div>

        <div className="card bg-base-200">
          <div className="card-body text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">Your wishlist is empty</h3>
            <p className="text-base-content/70 mb-6">
              Save items you love for later by clicking the heart icon
            </p>
            <Link href="/shop" className="btn btn-primary mx-auto gap-2">
              <ShoppingBag className="w-4 h-4" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">My Wishlist</h2>
          <p className="text-base-content/70 mt-1">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link href="/shop" className="btn btn-outline gap-2">
          <ShoppingBag className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
