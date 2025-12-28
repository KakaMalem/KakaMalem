'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useInView } from 'react-intersection-observer'
import { useSearchParams } from 'next/navigation'
import { Store, Eye, Search } from 'lucide-react'
import type { Storefront, Product, Category } from '@/payload-types'
import { ProductCard } from '@/app/(frontend)/components/ProductCard'
import {
  ProductCardSkeleton,
  getSkeletonCount,
} from '@/app/(frontend)/components/ProductCardSkeleton'

const PAGE_SIZE = 12

interface StorefrontClientProps {
  storefront: Storefront
  initialProducts: Product[]
  categories: Category[]
  totalProducts: number
  isPreviewMode?: boolean
}

export default function StorefrontClient({
  storefront,
  initialProducts,
  categories: _categories,
  totalProducts: _totalProducts,
  isPreviewMode = false,
}: StorefrontClientProps) {
  // _totalProducts and _categories are unused but kept for API compatibility
  const searchParams = useSearchParams()
  const searchQueryFromUrl = searchParams.get('q')

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length >= PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState<string | null>(searchQueryFromUrl)

  // Infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })

  // Status label for preview mode
  const statusLabels: Record<string, string> = {
    pending_review: 'در انتظار بررسی',
    suspended: 'معلق',
    inactive: 'غیرفعال',
  }

  // Fetch products with search filter
  const fetchProducts = useCallback(
    async (query: string | null) => {
      if (!storefront.slug) return

      setPage(1)
      setLoading(true)

      try {
        const params = new URLSearchParams({
          storefrontSlug: storefront.slug,
          page: '1',
          limit: PAGE_SIZE.toString(),
          // Default uses displayOrder from endpoint for seller-defined order
        })

        if (query) {
          params.set('q', query)
        }

        const res = await fetch(`/api/get-storefront-products?${params}`)
        const data = await res.json()

        if (data.products) {
          setProducts(data.products)
          setHasMore(data.pagination?.hasNextPage || data.products.length >= PAGE_SIZE)
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    },
    [storefront.slug],
  )

  // Handle URL parameter changes (search query only - categories use routes now)
  useEffect(() => {
    const newQuery = searchParams.get('q')

    // Check if search query changed
    if (newQuery !== searchQuery) {
      setSearchQuery(newQuery)
      fetchProducts(newQuery)
    }
  }, [searchParams, searchQuery, fetchProducts])

  // Load more products
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !storefront.slug) return

    setLoading(true)
    try {
      const nextPage = page + 1
      const params = new URLSearchParams({
        storefrontSlug: storefront.slug,
        page: nextPage.toString(),
        limit: PAGE_SIZE.toString(),
        // Default uses displayOrder from endpoint for seller-defined order
      })

      if (searchQuery) {
        params.set('q', searchQuery)
      }

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
  }, [loading, hasMore, page, storefront.slug, searchQuery])

  // Trigger load more when sentinel is in view
  useEffect(() => {
    if (inView) loadMore()
  }, [inView, loadMore])

  // Empty state
  if (products.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-warning text-warning-content py-3 px-4 rounded-lg mb-6">
            <div className="flex items-center justify-center gap-3 text-sm">
              <Eye className="w-5 h-5" />
              <span className="font-medium">
                حالت پیش‌نمایش - این فروشگاه هنوز فعال نشده است
                {storefront.status && ` (${statusLabels[storefront.status] || storefront.status})`}
              </span>
              <Link href="/dashboard/storefront" className="btn btn-xs btn-ghost">
                ویرایش فروشگاه
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-16 h-16 text-base-content/20 mb-4" />
          {searchQuery ? (
            <>
              <h2 className="text-xl font-semibold mb-2">نتیجه‌ای یافت نشد</h2>
              <p className="text-base-content/60 mb-4">
                جستجوی شما برای &quot;{searchQuery}&quot; نتیجه‌ای نداشت.
              </p>
              <Link href={`/store/${storefront.slug}`} className="btn btn-primary btn-sm">
                مشاهده همه محصولات
              </Link>
            </>
          ) : (
            <>
              <Store className="w-16 h-16 text-base-content/20 mb-4" />
              <h2 className="text-xl font-semibold mb-2">محصولی موجود نیست</h2>
              <p className="text-base-content/60">در حال حاضر محصولی در این فروشگاه وجود ندارد.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-warning text-warning-content py-3 px-4 rounded-lg mb-6">
          <div className="flex items-center justify-center gap-3 text-sm">
            <Eye className="w-5 h-5" />
            <span className="font-medium">
              حالت پیش‌نمایش - این فروشگاه هنوز فعال نشده است
              {storefront.status && ` (${statusLabels[storefront.status] || storefront.status})`}
            </span>
            <Link href="/dashboard/storefront" className="btn btn-xs btn-ghost">
              ویرایش فروشگاه
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Search Header */}
        {searchQuery && (
          <div className="flex items-center gap-2 text-base-content/70">
            <Search className="w-4 h-4" />
            <span>نتایج جستجو برای &quot;{searchQuery}&quot;</span>
            <Link href={`/store/${storefront.slug}`} className="btn btn-xs btn-ghost text-primary">
              پاک کردن فیلتر
            </Link>
          </div>
        )}

        {/* Products Grid - Same as homepage */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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

        {/* End of list indicator */}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-base-content/60">
              به پایان رسیدید. نمایش همه {products.length} محصول.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
