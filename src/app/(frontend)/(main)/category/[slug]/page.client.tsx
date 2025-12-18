'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { ProductCard } from '@/app/(frontend)/components/ProductCard'
import type { Category, Product } from '@/payload-types'
import Link from 'next/link'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

interface CategoryPageClientProps {
  category: Category
  initialProducts: Product[]
  totalProducts: number
  totalPages: number
  currentPage: number
}

interface ApiResponse {
  success?: boolean
  products?: Product[]
  docs?: Product[]
  pagination?: {
    totalPages?: number
    page?: number
    totalDocs?: number
  }
  totalPages?: number
  page?: number
  totalDocs?: number
}

const PAGE_SIZE = 12

export default function CategoryPageClient({
  category,
  initialProducts,
  totalProducts,
  totalPages,
  currentPage: initialPage,
}: CategoryPageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(initialPage < totalPages)
  const [loading, setLoading] = useState(false)

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  })

  const normalizeBody = (body: ApiResponse | null) => {
    if (!body) return { products: [], totalPages: 0, currentPage: 1, totalProducts: 0 }

    if (body.success && Array.isArray(body.products)) {
      return {
        products: body.products,
        totalPages: body.pagination?.totalPages ?? 0,
        currentPage: body.pagination?.page ?? 1,
        totalProducts: body.pagination?.totalDocs ?? 0,
      }
    }

    if (Array.isArray(body.docs)) {
      return {
        products: body.docs,
        totalPages: body.totalPages ?? 0,
        currentPage: body.page ?? 1,
        totalProducts: body.totalDocs ?? 0,
      }
    }

    return { products: [], totalPages: 0, currentPage: 1, totalProducts: 0 }
  }

  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const nextPage = currentPage + 1
      const params = new URLSearchParams()
      params.append('page', String(nextPage))
      params.append('limit', String(PAGE_SIZE))
      params.append('category', category.id)

      const response = await fetch(`/api/search-products?${params.toString()}`)
      const body = await response.json().catch(() => null)

      const normalized = normalizeBody(body)

      if (normalized.products.length > 0) {
        setProducts((prev) => [...prev, ...normalized.products])
        setCurrentPage(nextPage)
        setHasMore(nextPage < normalized.totalPages)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage, category.id])

  // Trigger load more when the sentinel element comes into view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreProducts()
    }
  }, [inView, hasMore, loading, loadMoreProducts])

  if (products.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-base-100">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <Breadcrumb items={[{ label: category.name, active: true }]} />
        </div>

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-4">
          {/* <h1 className="text-3xl font-semibold mb-1">{category.name}</h1>
          {category.description && (
            <p className="text-base-content/70 max-w-3xl text-sm">{category.description}</p>
          )} */}
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="text-center py-16">
            <p className="text-lg text-base-content/70 mb-4">No products found in this category.</p>
            <Link href="/" className="btn btn-primary">
              Browse All Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Breadcrumb items={[{ label: category.name, active: true }]} />
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-2 pb-4">
        {/* <h1 className="text-3xl font-semibold mb-1">{category.name}</h1>
        {category.description && (
          <p className="text-base-content/70 max-w-3xl text-sm">{category.description}</p>
        )} */}
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid gap-6 auto-rows-fr items-stretch grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* Loading Skeletons - fill remaining columns in last row */}
          {loading &&
            (() => {
              // Calculate how many skeletons needed to fill the row
              // Using 4 columns (lg breakpoint) as the max
              const cols = 4
              const remainder = products.length % cols
              const skeletonsNeeded = remainder === 0 ? cols : cols - remainder
              return Array.from({ length: skeletonsNeeded }, (_, i) => (
                <div
                  key={`skeleton-${i}`}
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
              ))
            })()}
        </div>

        {/* Infinite Scroll Sentinel */}
        {hasMore && (
          <div ref={ref} className="flex justify-center py-8">
            {!loading && <span className="loading loading-spinner loading-lg text-primary"></span>}
          </div>
        )}

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
  )
}
