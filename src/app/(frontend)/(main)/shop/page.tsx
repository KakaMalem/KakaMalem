// app/(frontend)/(main)/shop/page.tsx
import React from 'react'
import ShopClient from './page.client'
import type { Product } from '@/payload-types'

interface ShopPageData {
  products: Product[]
  totalPages: number
  currentPage: number
  totalProducts: number
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

type SearchParams = {
  q?: string
  page?: string
  limit?: string
  sort?: string
}

function normalizeApiBody(body: ApiResponse | null): ShopPageData {
  if (!body) {
    return { products: [], totalPages: 0, currentPage: 1, totalProducts: 0 }
  }

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

  return {
    products: Array.isArray(body.products) ? body.products : [],
    totalPages: body.totalPages ?? body.pagination?.totalPages ?? 0,
    currentPage: body.page ?? body.pagination?.page ?? 1,
    totalProducts: body.totalDocs ?? body.pagination?.totalDocs ?? 0,
  }
}

export default async function Page({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = searchParams ? await searchParams : {}
  const q = (params?.q as string) ?? ''
  const page = parseInt((params?.page as string) ?? '1', 10) || 1
  const limit = parseInt((params?.limit as string) ?? String(PAGE_SIZE), 10) || PAGE_SIZE
  const sort = (params?.sort as string) ?? 'featured'

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const url = new URL('/api/search-products', base)
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('sort', sort)
  if (q && q.trim()) url.searchParams.set('q', q.trim())

  const res = await fetch(url.toString(), { cache: 'no-store' })
  let body: ApiResponse | null
  try {
    body = await res.json()
  } catch (_e) {
    body = null
  }

  const initialData = normalizeApiBody(body)

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Pass only the props the client expects */}
        <ShopClient initialData={initialData} initialPage={page} searchQuery={q} />
      </div>
    </div>
  )
}
