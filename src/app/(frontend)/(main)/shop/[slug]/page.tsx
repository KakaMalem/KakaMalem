import React from 'react'
import { notFound } from 'next/navigation'
import ProductDetailsClient from './page.client'
import { Product } from '@/payload-types'
import { MOCK_PRODUCTS } from '@/lib/mockProducts'

interface Params {
  slug: string
}

export async function generateStaticParams(): Promise<Params[]> {
  // Build static pages for every product in the mock list.
  // If you use a real API, replace this with a fetch for all slugs.
  return MOCK_PRODUCTS.map((p) => ({ slug: (p.slug as string) ?? p.id }))
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  // For real data, replace this with your server fetch to Payload or DB.
  const product = MOCK_PRODUCTS.find(
    (p) => String(p.slug) === String(slug) || String(p.id) === String(slug),
  )
  return (product as Product) ?? null
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
