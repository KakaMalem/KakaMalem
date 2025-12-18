import React from 'react'
import type { Metadata } from 'next'
import { Product } from '@/payload-types'
import HomeClient from './page.client'

export const metadata: Metadata = {
  title: 'صفحه اصلی',
  description:
    'فروشگاه اینترنتی کاکا معلم - مرور و خرید آنلاین محصولات متنوع با کیفیت بالا و ارسال سریع در کابل',
  openGraph: {
    title: 'کاکا معلم | فروشگاه اینترنتی',
    description: 'فروشگاه اینترنتی کاکا معلم - خرید آنلاین محصولات با کیفیت با ارسال سریع در کابل',
  },
}

// Fetch real data from API
async function fetchProducts(searchQuery?: string) {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    // Build URL with search query if provided
    const url = new URL(`${base}/api/search-products`)
    url.searchParams.set('limit', '12')
    if (searchQuery) {
      url.searchParams.set('q', searchQuery)
    }

    // Standard fetch with revalidation
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    })
    const data = await res.json()
    return data.docs || data.products || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

interface HomepageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function Homepage({ searchParams }: HomepageProps) {
  const params = await searchParams
  const searchQuery = params.q
  const products: Product[] = await fetchProducts(searchQuery)

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      {/* Container for the grid.
        No headers, no titles, just the content.
      */}
      <div className="max-w-7xl mx-auto">
        <HomeClient initialProducts={products} searchQuery={searchQuery} />
      </div>
    </div>
  )
}
