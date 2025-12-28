import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import ProductDetailsClient from '@/app/(frontend)/(main)/product/[slug]/page.client'
import { Product, ProductVariant, Media, Storefront } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { serializeRichText, type LexicalContent } from '@/utilities/serializeRichText'
import { RecentlyViewed } from '@/app/(frontend)/components/RecentlyViewed'
import StoreNavbar from '@/app/(frontend)/components/StoreNavbar'
import StoreFooter from '@/app/(frontend)/components/StoreFooter'
import { getMeUser } from '@/utilities/getMeUser'

interface Params {
  slug: string // Store slug
  productSlug: string // Product slug
}

// Generate dynamic metadata for store product page
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, productSlug } = await params
  const payload = await getPayload({ config })

  // Find storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const storefront = storefronts.docs[0]

  // Find product
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: decodeURIComponent(productSlug) } },
    limit: 1,
    depth: 1,
  })

  const product = products.docs[0]

  if (!product || !storefront) {
    return {
      title: 'محصول یافت نشد',
      description: 'محصول مورد نظر یافت نشد',
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
    product.shortDescription ||
    `خرید ${product.name} از فروشگاه ${storefront.name} - ${formattedPrice}`

  return {
    title: `${product.name} | ${storefront.name}`,
    description: metaDescription,
    keywords: [product.name, storefront.name, 'خرید آنلاین'],
    openGraph: {
      title: `${product.name} | ${storefront.name}`,
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
      cache: 'no-store',
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
        revalidate: 10,
        tags: ['variants', `variants-${productId}`],
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching variants:', error)
    return []
  }
}

export default async function StoreProductPage({ params }: { params: Promise<Params> }) {
  const { slug, productSlug } = await params
  const payload = await getPayload({ config })

  // Get current user
  const { user } = await getMeUser()

  // Find storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  const storefront = storefronts.docs[0] as Storefront | undefined

  if (!storefront) {
    notFound()
  }

  // Check if storefront is active (or user is owner/admin)
  const sellerId =
    typeof storefront.seller === 'object' && storefront.seller
      ? storefront.seller.id
      : storefront.seller
  const isOwner = user && sellerId === user.id
  const isAdmin =
    user?.roles?.includes('admin') ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('developer')

  if (storefront.status !== 'active' && !isOwner && !isAdmin) {
    notFound()
  }

  // Find product and verify it belongs to this store
  const products = await payload.find({
    collection: 'products',
    where: {
      and: [
        { slug: { equals: decodeURIComponent(productSlug) } },
        { stores: { contains: storefront.id } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 2,
  })

  const product = products.docs[0] as Product | undefined

  if (!product) {
    notFound()
  }

  // Check authentication
  const isAuthenticated = await checkAuthentication()

  // Fetch variants if product has variants
  const variants = product.hasVariants ? await getProductVariants(product.id) : []

  // Serialize rich text description to HTML
  const descriptionHtml = product.description ? serializeRichText(product.description) : ''

  // Pre-serialize variant descriptions for client-side rendering
  const variantDescriptions: Record<string, string> = {}
  for (const variant of variants) {
    if (variant.description && typeof variant.description === 'object') {
      variantDescriptions[variant.id] = serializeRichText(variant.description as LexicalContent)
    }
  }

  return (
    <>
      {/* Pass empty categories to hide the category bar on product pages */}
      <StoreNavbar storefront={storefront} categories={[]} user={user} />

      <main className="min-h-screen bg-base-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <ProductDetailsClient
            product={product}
            descriptionHtml={descriptionHtml}
            isAuthenticated={isAuthenticated}
            initialVariants={variants}
            variantDescriptions={variantDescriptions}
            storeSlug={slug}
            storeName={storefront.name}
          />
        </div>

        {/* Recently Viewed Section */}
        <div className="bg-base-200 py-16 mt-16">
          <div className="max-w-7xl mx-auto px-4">
            <RecentlyViewed />
          </div>
        </div>
      </main>

      <StoreFooter storefront={storefront} categories={[]} />
    </>
  )
}
