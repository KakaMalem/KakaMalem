'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import type { Storefront, Product, Category } from '@/payload-types'
import { ProductCard } from '@/app/(frontend)/components/ProductCard'
import {
  ProductCardSkeleton,
  getSkeletonCount,
} from '@/app/(frontend)/components/ProductCardSkeleton'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

const PAGE_SIZE = 12

interface StoreCategoryClientProps {
  storefront: Storefront
  category: Category
  initialProducts: Product[]
  totalProducts: number
}

export default function StoreCategoryClient({
  storefront,
  category,
  initialProducts,
  totalProducts,
}: StoreCategoryClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length >= PAGE_SIZE)

  // Infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })

  // Load more products
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !storefront.slug) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams({
        storefrontSlug: storefront.slug,
        categorySlug: category.slug || '',
        page: nextPage.toString(),
        limit: PAGE_SIZE.toString(),
        sort: 'newest',
      })

      const res = await fetch(`/api/get-storefront-products?${params}`)
      const data = await res.json()
      const newItems = data.products || []

      if (newItems.length === 0) {
        setHasMore(false)
      } else {
        setProducts((prev) => [...prev, ...newItems])
        setPage(nextPage)
        if (newItems.length < PAGE_SIZE) {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Failed to load more products:', error)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, storefront.slug, category.slug])

  // Trigger load more when sentinel is in view
  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  const storeBaseUrl = `/store/${storefront.slug}`

  // Empty state
  if (products.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-base-100">
        {/* Breadcrumb - Store as home, not main KakaMalem */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <Breadcrumb
            items={[
              { label: storefront.name, href: storeBaseUrl },
              { label: category.name, active: true },
            ]}
            showHome={false}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-lg text-base-content/70 mb-4">
              محصولی در دسته‌بندی &quot;{category.name}&quot; یافت نشد.
            </p>
            <Link href={storeBaseUrl} className="btn btn-primary">
              مشاهده همه محصولات
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Breadcrumb - Store as home, not main KakaMalem */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Breadcrumb
          items={[
            { label: storefront.name, href: storeBaseUrl },
            { label: category.name, active: true },
          ]}
          showHome={false}
        />
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="grid gap-6 auto-rows-fr items-stretch grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={storefront.slug || undefined}
              />
            ))}

            {/* Loading Skeletons */}
            {loading &&
              Array.from({ length: getSkeletonCount(products.length) }, (_, i) => (
                <ProductCardSkeleton key={`skeleton-${i}`} />
              ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={ref} className="h-4" />

          {/* End of Results Message */}
          {!hasMore && products.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-base-content/60">
                به پایان رسیدید. نمایش همه {totalProducts} محصول.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
