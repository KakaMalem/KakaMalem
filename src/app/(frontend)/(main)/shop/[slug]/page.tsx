import React from 'react'
import { notFound } from 'next/navigation'
import ProductDetailsClient from './page.client'
import { Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

interface Params {
  slug: string
}

export async function generateStaticParams(): Promise<Params[]> {
  try {
    const baseUrl = getServerSideURL()
    const url = new URL('/api/products', baseUrl)
    url.searchParams.set('limit', '1000') // Get all products for static generation
    url.searchParams.set('depth', '0') // Shallow fetch for slugs only

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!res.ok) {
      console.error('Failed to fetch products for static params')
      return []
    }

    const body = await res.json()
    const products = body.docs || body.products || []

    return products.filter((p: any) => p.slug).map((p: any) => ({ slug: p.slug }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const baseUrl = getServerSideURL()
    const url = new URL('/api/products', baseUrl)
    url.searchParams.set('where[slug][equals]', slug)
    url.searchParams.set('depth', '2') // Populate relationships like images and categories
    url.searchParams.set('limit', '1')

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      next: { revalidate: 60 }, // Revalidate every minute
    })

    if (!res.ok) {
      console.error(`Failed to fetch product with slug: ${slug}`)
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

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = params
  const product = await getProductBySlug(slug)

  if (!product) return notFound()

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* ProductDetailsClient expects serializable product props */}
        <ProductDetailsClient product={product as Product} />
      </div>
    </div>
  )
}
