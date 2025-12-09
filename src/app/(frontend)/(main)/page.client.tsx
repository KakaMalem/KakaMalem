'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { Product } from '@/payload-types'
import { ProductCard } from '../components/ProductCard'

interface HomeClientProps {
  initialProducts: Product[]
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  // Intersection observer to trigger load when user scrolls to bottom
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px', // Start loading 200px before reaching the bottom
  })

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)

    try {
      const nextPage = page + 1
      const res = await fetch(`/api/search-products?page=${nextPage}&limit=12`)
      const data = await res.json()
      const newItems = data.docs || data.products || []

      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setProducts((prev) => [...prev, ...newItems])
        setPage(nextPage)
      }
    } catch (e) {
      console.error('Infinite scroll error:', e)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Render Actual Products */}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Better Loading Skeleton 
           Matches the exact shape of ProductCard (Aspect 4/5 + padding)
        */}
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="card card-compact bg-base-100 border border-base-200 overflow-hidden h-full"
            >
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
          ))}
      </div>

      {/* Footer / End of list indicator */}
      <div ref={ref} className="flex justify-center py-8">
        {!hasMore && products.length > 0 && (
          <div className="text-xs font-bold text-base-content/30 tracking-widest uppercase">
            End of Collection
          </div>
        )}
      </div>
    </div>
  )
}
