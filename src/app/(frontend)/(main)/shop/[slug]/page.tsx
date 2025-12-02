import React from 'react'
import { notFound } from 'next/navigation'
import ProductDetailsClient from './page.client'
import { Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { serializeRichText } from '@/utilities/serializeRichText'

interface Params {
  slug: string
}

// Generate static paths for all products
// Note: Returns empty array to rely on on-demand ISR generation
// This avoids build-time dependency on running server
export async function generateStaticParams(): Promise<Params[]> {
  // Pages will be generated on-demand and cached with ISR
  // This approach works without requiring the server to be running during build
  return []
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const baseUrl = getServerSideURL()

    // Decode the slug in case it comes URL-encoded, then re-encode for the API query
    const decodedSlug = decodeURIComponent(slug)

    const url = new URL('/api/products', baseUrl)
    url.searchParams.set('where[slug][equals]', decodedSlug)
    url.searchParams.set('depth', '2') // Populate relationships like images and categories
    url.searchParams.set('limit', '1')

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 }, // Revalidate every minute
    })

    if (!res.ok) {
      console.error(`Failed to fetch product with slug: ${decodedSlug}`)
      return null
    }

    const body = await res.json()
    const products = body.docs || body.products || []

    return products.length > 0 ? products[0] : null
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) return notFound()

  // Serialize rich text description to HTML
  const descriptionHtml = product.description ? serializeRichText(product.description) : ''

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* ProductDetailsClient will check auth on client side */}
        <ProductDetailsClient product={product as Product} descriptionHtml={descriptionHtml} />
      </div>
    </div>
  )
}
