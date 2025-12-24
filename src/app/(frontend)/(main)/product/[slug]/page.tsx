import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import ProductDetailsClient from './page.client'
import { Product, ProductVariant, Media } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { serializeRichText } from '@/utilities/serializeRichText'
import { RecentlyViewed } from '@/app/(frontend)/components/RecentlyViewed'

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

// Generate dynamic metadata for each product
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlugForMetadata(slug)

  if (!product) {
    return {
      title: 'محصول یافت نشد',
      description: 'محصول مورد نظریه یافت نشد',
    }
  }

  // Extract image URL
  const imageUrl =
    product.images && product.images.length > 0
      ? typeof product.images[0] === 'object'
        ? (product.images[0] as Media).url
        : null
      : null

  const price = product.salePrice || product.price
  const formattedPrice = `${price.toLocaleString()} افغانی`

  const metaDescription =
    product.shortDescription || `خرید ${product.name} از فروشگاه کاکا معلم - ${formattedPrice}`

  return {
    title: product.name,
    description: metaDescription,
    keywords: [product.name, 'خرید آنلاین', 'کاکا معلم'],
    openGraph: {
      title: product.name,
      description: metaDescription,
      type: 'website',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

// Separate function for metadata to avoid duplicate fetches
async function getProductBySlugForMetadata(slug: string): Promise<Product | null> {
  try {
    const baseUrl = getServerSideURL()
    const decodedSlug = decodeURIComponent(slug)

    const url = new URL('/api/products', baseUrl)
    url.searchParams.set('where[slug][equals]', decodedSlug)
    url.searchParams.set('depth', '1')
    url.searchParams.set('limit', '1')

    const res = await fetch(url.toString(), {
      cache: 'no-store',
    })

    if (!res.ok) return null

    const body = await res.json()
    const products = body.docs || body.products || []
    return products.length > 0 ? products[0] : null
  } catch {
    return null
  }
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
      cache: 'no-store', // No caching to ensure fresh ratings and stock info
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

async function checkAuthentication(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('kakamalem-token')?.value

    if (!token) {
      return false
    }

    const baseUrl = getServerSideURL()
    const response = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
      cache: 'no-store', // Don't cache auth checks
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return !!(data && data.user)
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const baseUrl = getServerSideURL()
    const response = await fetch(`${baseUrl}/api/variants/product/${productId}`, {
      next: {
        revalidate: 10, // Revalidate every 10 seconds
        tags: ['variants', `variants-${productId}`],
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch variants for product: ${productId}`)
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching variants:', error)
    return []
  }
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) return notFound()

  // Check authentication on the server
  const isAuthenticated = await checkAuthentication()

  // Fetch variants if product has variants
  const variants = product.hasVariants ? await getProductVariants(product.id) : []

  // Serialize rich text description to HTML
  const descriptionHtml = product.description ? serializeRichText(product.description) : ''

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Pass server-side auth status and variants to client */}
        <ProductDetailsClient
          product={product as Product}
          descriptionHtml={descriptionHtml}
          isAuthenticated={isAuthenticated}
          initialVariants={variants}
        />
      </div>

      {/* Recently Viewed Section */}
      <div className="bg-base-200 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <RecentlyViewed />
        </div>
      </div>
    </div>
  )
}
