'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { Search } from 'lucide-react'
import { Product } from '@/payload-types'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton, getSkeletonCount } from '../components/ProductCardSkeleton'

const PAGE_SIZE = 12

interface HomeClientProps {
  initialProducts: Product[]
  searchQuery?: string
}

export default function HomeClient({ initialProducts, searchQuery }: HomeClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(1)
  // Only hasMore if we received a full page of products
  const [hasMore, setHasMore] = useState(initialProducts.length >= PAGE_SIZE)
  const [loading, setLoading] = useState(false)

  // Reset products when search query changes
  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
    setHasMore(initialProducts.length >= PAGE_SIZE)
  }, [searchQuery, initialProducts])

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
      // Build URL with search query if provided
      const url = new URL('/api/search-products', window.location.origin)
      url.searchParams.set('page', nextPage.toString())
      url.searchParams.set('limit', PAGE_SIZE.toString())
      if (searchQuery) {
        url.searchParams.set('q', searchQuery)
      }

      const res = await fetch(url.toString())
      const data = await res.json()
      const newItems = data.docs || data.products || []

      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setProducts((prev) => [...prev, ...newItems])
        setPage(nextPage)
        // If we got fewer items than requested, we've reached the end
        if (newItems.length < PAGE_SIZE) {
          setHasMore(false)
        }
      }
    } catch (e) {
      console.error('Infinite scroll error:', e)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, searchQuery])

  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  // Empty state when no products found
  if (products.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="w-16 h-16 text-base-content/20 mb-4" />
        {searchQuery ? (
          <>
            <h2 className="text-xl font-semibold mb-2">نتیجه‌ای یافت نشد</h2>
            <p className="text-base-content/60 mb-1">
              جستجوی شما برای &quot;{searchQuery}&quot; نتیجه‌ای نداشت.
            </p>
            <p className="text-base-content/40 text-sm">لطفاً کلمات دیگری را امتحان کنید.</p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2">محصولی موجود نیست</h2>
            <p className="text-base-content/60">در حال حاضر محصولی برای نمایش وجود ندارد.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search Results Header */}
      {searchQuery && products.length > 0 && (
        <div className="flex items-center gap-2 text-base-content/70">
          <Search className="w-4 h-4" />
          <span>نتایج جستجو برای &quot;{searchQuery}&quot;</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Render Actual Products */}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {/* Loading Skeletons */}
        {loading &&
          Array.from({ length: getSkeletonCount(products.length) }, (_, i) => (
            <ProductCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={ref} className="h-4" />

      {/* End of list indicator */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-base-content/60">
            به پایان رسیدید. نمایش همه {products.length} محصول.
          </p>
        </div>
      )}
    </div>
  )
}
