'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductCard } from '../../components/ProductCard'
import { Product } from '@/payload-types'

interface ShopPageData {
  products: Product[]
  totalPages: number
  currentPage: number
  totalProducts: number
}

const PAGE_SIZE = 12

export default function ShopPage() {
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get('q') || ''

  const [data, setData] = useState<ShopPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState(queryFromUrl)
  const [sortBy, setSortBy] = useState('featured')
  const [currentPage, setCurrentPage] = useState(1)

  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(queryFromUrl)
  }, [queryFromUrl])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, searchQuery])

  const fetchProducts = async () => {
    setLoading(true)

    try {
      // Build query parameters
      const params = new URLSearchParams()

      if (searchQuery && searchQuery.trim()) {
        params.append('q', searchQuery.trim())
      }
      if (sortBy) {
        params.append('sort', sortBy)
      }
      params.append('page', currentPage.toString())
      params.append('limit', PAGE_SIZE.toString())

      const response = await fetch(`/api/search?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setData({
          products: result.products,
          totalPages: result.pagination.totalPages,
          currentPage: result.pagination.page,
          totalProducts: result.pagination.totalDocs,
        })
      } else {
        console.error('Search failed:', result.error)
        // Set empty data on error
        setData({
          products: [],
          totalPages: 0,
          currentPage: 1,
          totalProducts: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // Set empty data on error
      setData({
        products: [],
        totalPages: 0,
        currentPage: 1,
        totalProducts: 0,
      })
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
    <div className="min-h-screen bg-base-100">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex-1">
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
                <div
                  className={`grid gap-6 auto-rows-fr items-stretch ${
                    viewMode === 'grid'
                      ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-1'
                  }`}
                >
                  {data.products.map((product) => (
                    <div key={product.id} className="w-full h-full">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-xl text-base-content/70">No products found</p>
                  <p className="text-sm text-base-content/50 mt-2">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex justify-center mt-12">
                  <div className="join">
                    <button
                      className="join-item btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
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
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
