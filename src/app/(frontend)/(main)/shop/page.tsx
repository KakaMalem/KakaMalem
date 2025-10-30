'use client'

import React, { useState, useEffect } from 'react'
import { Search, Grid3x3, List, ChevronDown } from 'lucide-react'
import { ProductCard } from '../../components/ProductCard'
import { Product } from '@/payload-types'
import { MOCK_PRODUCTS } from '@/lib/mockProducts'

interface ShopPageData {
  products: Product[]
  totalPages: number
  currentPage: number
  totalProducts: number
}

const PAGE_SIZE = 12 // change this to control pagination (e.g., 8 or 16)

const generateMockData = (page: number, query = '', sortBy = 'featured'): ShopPageData => {
  // clone array to avoid mutating original
  let allProducts = [...MOCK_PRODUCTS] as Product[]

  // simple search (name or shortDescription)
  if (query && query.trim().length > 0) {
    const q = query.trim().toLowerCase()
    allProducts = allProducts.filter(
      (p) =>
        String(p.name).toLowerCase().includes(q) ||
        String(p.shortDescription ?? '')
          .toLowerCase()
          .includes(q),
    )
  }

  // simple sort examples (expand as needed)
  if (sortBy === 'price-asc') {
    allProducts.sort((a: any, b: any) => Number(a.price ?? 0) - Number(b.price ?? 0))
  } else if (sortBy === 'price-desc') {
    allProducts.sort((a: any, b: any) => Number(b.price ?? 0) - Number(a.price ?? 0))
  } // 'featured' keeps original order

  const totalProducts = allProducts.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  const products = allProducts.slice(start, end)

  return {
    products: products as Product[],
    totalPages,
    currentPage: safePage,
    totalProducts,
  }
}

export default function ShopPage() {
  const [data, setData] = useState<ShopPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, searchQuery])

  const fetchProducts = async () => {
    setLoading(true)
    // simulate an async fetch (replace this with real API call later)
    setTimeout(() => {
      setData(generateMockData(currentPage, searchQuery, sortBy))
      setLoading(false)
    }, 300)
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-error"></span>
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
              <span className="loading loading-spinner loading-lg text-error"></span>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-base-content/70">
                  Showing {data?.products.length} of {data?.totalProducts} products
                </p>
              </div>

              {/* Products */}
              <div
                className={`grid gap-6 auto-rows-fr items-stretch ${
                  viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'
                }`}
              >
                {data?.products.map((product) => (
                  // wrap each card so the grid item is a block with full height/width
                  <div key={product.id} className="w-full h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

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
