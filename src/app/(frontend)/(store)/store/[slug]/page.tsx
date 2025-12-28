import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import StorefrontClient from './page.client'
import { getMeUser } from '@/utilities/getMeUser'
import StoreNavbar from '@/app/(frontend)/components/StoreNavbar'
import StoreFooter from '@/app/(frontend)/components/StoreFooter'

interface StorefrontPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  // For metadata, we just check if storefront exists (regardless of status)
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  if (storefronts.docs.length === 0) {
    return {
      title: 'فروشگاه یافت نشد',
    }
  }

  const storefront = storefronts.docs[0]

  return {
    title: storefront.seo?.metaTitle || storefront.name,
    description:
      storefront.seo?.metaDescription ||
      storefront.description ||
      `فروشگاه ${storefront.name} در کاکا معلم`,
  }
}

export default async function StorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params
  const payload = await getPayload({ config })

  // Get current user (if logged in)
  const { user } = await getMeUser()

  // First, find the storefront by slug (regardless of status)
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      slug: { equals: slug },
    },
    depth: 2,
    limit: 1,
  })

  if (storefronts.docs.length === 0) {
    notFound()
  }

  const storefront = storefronts.docs[0]
  const sellerId =
    typeof storefront.seller === 'object' && storefront.seller
      ? storefront.seller.id
      : storefront.seller

  // Check if user is the owner of this storefront
  const isOwner = user && sellerId === user.id

  // Check if user is admin/developer
  const isAdmin =
    user?.roles?.includes('admin') ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('developer')

  // If storefront is not active, only the owner or admin can see it
  if (storefront.status !== 'active' && !isOwner && !isAdmin) {
    notFound()
  }

  // Flag to show preview mode banner for owners viewing non-active storefronts
  const isPreviewMode = storefront.status !== 'active' && (isOwner || isAdmin)

  // Get products linked to this storefront
  const products = await payload.find({
    collection: 'products',
    where: {
      and: [{ stores: { contains: storefront.id } }, { _status: { equals: 'published' } }],
    },
    limit: 12,
    sort: 'displayOrder',
    depth: 1,
  })

  // Get storefront categories from unified Categories collection
  const categories = await payload.find({
    collection: 'categories',
    where: {
      and: [{ stores: { contains: storefront.id } }, { showInMenu: { equals: true } }],
    },
    sort: 'displayOrder',
    limit: 50,
  })

  // Update view count and unique visitors (fire and forget) - only for active storefronts
  if (storefront.status === 'active') {
    // Track unique visitors using user ID for authenticated users
    const existingViewers: string[] = (storefront.analytics?.viewedByUsers as string[]) || []
    let isNewVisitor = false

    // Only track unique visitors for authenticated users
    // Guest unique visitors are harder to track without cookies (would require client-side tracking)
    if (user?.id && !existingViewers.includes(user.id)) {
      isNewVisitor = true
    }

    // Update viewedByUsers array (keep last 1000 unique users)
    const updatedViewers =
      isNewVisitor && user?.id ? [...existingViewers, user.id].slice(-1000) : existingViewers

    payload
      .update({
        collection: 'storefronts',
        id: storefront.id,
        data: {
          analytics: {
            ...(storefront.analytics || {}),
            totalViews: (storefront.analytics?.totalViews || 0) + 1,
            uniqueVisitors: isNewVisitor
              ? (storefront.analytics?.uniqueVisitors || 0) + 1
              : storefront.analytics?.uniqueVisitors || 0,
            lastVisited: new Date().toISOString(),
            viewedByUsers: updatedViewers,
          },
        },
        overrideAccess: true,
      })
      .catch(() => {})
  }

  return (
    <>
      {/* Store-specific navbar with store branding and categories */}
      <StoreNavbar storefront={storefront} categories={categories.docs} user={user} />
      <main>
        <StorefrontClient
          storefront={storefront}
          initialProducts={products.docs}
          categories={categories.docs}
          totalProducts={products.totalDocs}
          isPreviewMode={isPreviewMode}
        />
      </main>
      <StoreFooter storefront={storefront} categories={categories.docs} />
    </>
  )
}
