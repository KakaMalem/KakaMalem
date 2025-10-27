'use client'

import React, { useState, useEffect } from 'react'
import { Search, Grid3x3, List, ChevronDown } from 'lucide-react'
import { ProductCard } from '../../components/ProductCard'
import { Product } from '@/payload-types'

interface ShopPageData {
  products: Product[]
  totalPages: number
  currentPage: number
  totalProducts: number
}

// Mock data generator - Replace with actual Payload API calls
const generateMockData = (page: number): ShopPageData => {
  // Note: images use string URLs to match `string | Media` typing
  const allProducts = [
    {
      id: '1',
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      price: 1299,
      salePrice: 1199,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 342,
      images: [
        {
          alt: 'Samsung Galaxy',
          image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
        },
      ],
      shortDescription: 'Latest flagship with AI camera',
      status: 'published',
    },
    {
      id: '2',
      name: 'Sony WH-1000XM5 Headphones',
      slug: 'sony-wh-1000xm5',
      price: 399,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 567,
      images: [
        {
          alt: 'Sony Headphones',
          image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
        },
      ],
      shortDescription: 'Industry-leading noise cancellation',
      status: 'published',
    },
    {
      id: '3',
      name: 'Apple MacBook Pro 16"',
      slug: 'macbook-pro-16',
      price: 2499,
      salePrice: 2299,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 823,
      images: [
        {
          alt: 'MacBook Pro',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
        },
      ],
      shortDescription: 'M3 Max chip, stunning display',
      status: 'published',
    },
    {
      id: '4',
      name: 'Nike Air Max 270',
      slug: 'nike-air-max-270',
      price: 159,
      salePrice: 129,
      currency: 'USD',
      averageRating: 4.7,
      reviewCount: 678,
      images: [
        {
          alt: 'Nike Shoes',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        },
      ],
      shortDescription: 'Ultimate comfort and style',
      status: 'published',
    },
    {
      id: '5',
      name: 'Dyson V15 Detect Vacuum',
      slug: 'dyson-v15-vacuum',
      price: 649,
      salePrice: 549,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 423,
      images: [
        {
          alt: 'Dyson Vacuum',
          image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
        },
      ],
      shortDescription: 'Laser dust detection technology',
      status: 'published',
    },
    {
      id: '6',
      name: 'KitchenAid Stand Mixer',
      slug: 'kitchenaid-mixer',
      price: 449,
      salePrice: 349,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 892,
      images: [
        {
          alt: 'Stand Mixer',
          image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400',
        },
      ],
      shortDescription: 'Professional-grade appliance',
      status: 'published',
    },
    {
      id: '7',
      name: 'Canon EOS R6 Mark II',
      slug: 'canon-eos-r6',
      price: 2499,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 189,
      images: [
        {
          alt: 'Canon Camera',
          image:
            'https://images.unsplash.com/photo-1599664223843-9349c75196bc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470',
        },
      ],
      shortDescription: 'Professional mirrorless camera',
      status: 'published',
    },
    {
      id: '8',
      name: "Levi's 501 Original Jeans",
      slug: 'levis-501-jeans',
      price: 89,
      salePrice: 69,
      currency: 'USD',
      averageRating: 4.6,
      reviewCount: 1234,
      images: [
        {
          alt: "Levi's Jeans",
          image:
            'https://plus.unsplash.com/premium_photo-1674828601017-2b8d4ea90aca?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=732',
        },
      ],
      shortDescription: 'Classic fit, timeless style',
      status: 'published',
    },
    {
      id: '9',
      name: 'Apple AirPods Pro',
      slug: 'airpods-pro',
      price: 249,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 1567,
      images: [
        {
          alt: 'AirPods Pro',
          image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
        },
      ],
      shortDescription: 'Active noise cancellation',
      status: 'published',
    },
    {
      id: '10',
      name: 'Instant Pot Duo',
      slug: 'instant-pot-duo',
      price: 119,
      salePrice: 89,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 2341,
      images: [
        {
          alt: 'Instant Pot',
          image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
        },
      ],
      shortDescription: '7-in-1 pressure cooker',
      status: 'published',
    },
    {
      id: '11',
      name: 'Adidas Ultraboost 23',
      slug: 'adidas-ultraboost',
      price: 189,
      salePrice: 139,
      currency: 'USD',
      averageRating: 4.7,
      reviewCount: 834,
      images: [
        {
          alt: 'Adidas Shoes',
          image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
        },
      ],
      shortDescription: 'Premium running shoes',
      status: 'published',
    },
    {
      id: '12',
      name: 'iPad Air 5th Generation',
      slug: 'ipad-air-5',
      price: 599,
      salePrice: 499,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 723,
      images: [
        {
          alt: 'iPad Air',
          image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        },
      ],
      shortDescription: 'M1 chip, stunning display',
      status: 'published',
    },
  ]

  return {
    products: allProducts as unknown as Product[],
    totalPages: 3,
    currentPage: page,
    totalProducts: allProducts.length,
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
    // Replace with actual Payload API call
    setTimeout(() => {
      setData(generateMockData(currentPage))
      setLoading(false)
    }, 500)
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
