import { useState, useEffect } from 'react'
import type { Product } from '@/payload-types'

interface SearchFilters {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  sort?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'featured'
  page?: number
  limit?: number
}

interface SearchResponse {
  success: boolean
  products: Product[]
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalDocs: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage?: number
    prevPage?: number
  }
  filters?: SearchFilters
  error?: string
}

export function useProductSearch(filters: SearchFilters) {
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build query string
        const params = new URLSearchParams()

        if (filters.q) params.append('q', filters.q)
        if (filters.category) params.append('category', filters.category)
        if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString())
        if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString())
        if (filters.rating !== undefined) params.append('rating', filters.rating.toString())
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/search?${params.toString()}`)
        const result: SearchResponse = await response.json()

        if (response.ok) {
          setData(result)
        } else {
          setError(result.error || 'Search failed')
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    searchProducts()
  }, [
    filters.q,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.rating,
    filters.sort,
    filters.page,
    filters.limit,
  ])

  return { data, loading, error }
}
