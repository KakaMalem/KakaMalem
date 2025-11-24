'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { ProductCard } from '../../components/ProductCard'
import type { Product } from '@/payload-types'

interface ShopPageData {
  products: Product[]
  totalPages: number
  currentPage: number
  totalProducts: number
}

interface Props {
  initialData: ShopPageData
  initialPage?: number
  searchQuery?: string
}

const PAGE_SIZE = 12

export default function ShopClient({ initialData, initialPage = 1, searchQuery = '' }: Props) {
  const [products, setProducts] = useState<Product[]>(initialData.products)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(initialData.currentPage < initialData.totalPages)
  const [loading, setLoading] = useState(false)
  const [totalProducts, setTotalProducts] = useState(initialData.totalProducts)
  const [query, setQuery] = useState(searchQuery)

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  })

  // Reset state when searchQuery prop changes (when user searches from navbar)
  useEffect(() => {
    setQuery(searchQuery)
    setProducts(initialData.products)
    setCurrentPage(initialPage)
    setHasMore(initialData.currentPage < initialData.totalPages)
    setTotalProducts(initialData.totalProducts)
  }, [searchQuery, initialData, initialPage])

  const normalizeBody = (body: any): ShopPageData => {
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
      if (query && query.trim()) {
        params.append('q', query.trim())
      }

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
  }, [loading, hasMore, currentPage, query])

  // Trigger load more when the sentinel element comes into view
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreProducts()
    }
  }, [inView, hasMore, loading, loadMoreProducts])

  if (products.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-xl text-base-content/70">
            {query ? `No products found for "${query}"` : 'No products found'}
          </p>
          <p className="text-sm text-base-content/50 mt-2">
            {query ? 'Try searching with different keywords' : 'Check back soon for new items'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Query Display */}
      {query && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-base-content">Search results for "{query}"</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Found {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 auto-rows-fr items-stretch grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div key={(product as any).id ?? (product as any)._id} className="w-full h-full">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* End of Results Message */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-base-content/60">
            You've reached the end. Showing all {totalProducts} products.
          </p>
        </div>
      )}
    </div>
  )
}
