'use client'

import React, { useEffect, useState } from 'react'
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
}

const PAGE_SIZE = 12

export default function ShopClient({ initialData, initialPage = 1 }: Props) {
  const [data, setData] = useState<ShopPageData>(initialData)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(initialPage)

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

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

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', String(currentPage))
      params.append('limit', String(PAGE_SIZE))

      const response = await fetch(`/api/products?${params.toString()}`)
      const body = await response.json().catch(() => null)

      const normalized = normalizeBody(body)
      setData(normalized)
    } catch (err) {
      console.error('Error fetching products:', err)
      setData({ products: [], totalPages: 0, currentPage: 1, totalProducts: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-base-content/70">
              Showing {data?.products.length || 0} of {data?.totalProducts || 0} products
            </p>
          </div>

          {/* Products */}
          {data && data.products.length > 0 ? (
            <div className="grid gap-6 auto-rows-fr items-stretch grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.products.map((product) => (
                <div key={(product as any).id ?? (product as any)._id} className="w-full h-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-base-content/70">No products found</p>
              <p className="text-sm text-base-content/50 mt-2">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  «
                </button>

                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`join-item btn ${currentPage === page ? 'btn-primary' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="join-item btn"
                  disabled={currentPage === data.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
