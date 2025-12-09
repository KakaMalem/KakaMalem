import React from 'react'
import { Product } from '@/payload-types'
import HomeClient from './page.client'

// Fetch real data from API
async function fetchProducts() {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    // Standard fetch with revalidation
    const res = await fetch(`${base}/api/search-products?limit=12`, {
      next: { revalidate: 60 },
    })
    const data = await res.json()
    return data.docs || data.products || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export default async function Homepage() {
  const products: Product[] = await fetchProducts()

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      {/* Container for the grid. 
        No headers, no titles, just the content. 
      */}
      <div className="max-w-7xl mx-auto">
        <HomeClient initialProducts={products} />
      </div>
    </div>
  )
}
