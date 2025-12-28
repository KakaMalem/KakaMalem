import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { getMeUser } from '@/utilities/getMeUser'
import StoreNavbar from '@/app/(frontend)/components/StoreNavbar'
import StoreFooter from '@/app/(frontend)/components/StoreFooter'
import StoreCategoryClient from './page.client'
import type { Category, Media } from '@/payload-types'

interface StoreCategoryPageProps {
  params: Promise<{ slug: string; categorySlug: string }>
}

export async function generateMetadata({ params }: StoreCategoryPageProps): Promise<Metadata> {
  const { slug, categorySlug } = await params
  const payload = await getPayload({ config })

  // Find storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const storefront = storefronts.docs[0]

  // Find category
  const categories = await payload.find({
    collection: 'categories',
    where: { slug: { equals: decodeURIComponent(categorySlug) } },
    limit: 1,
  })

  const category = categories.docs[0] as Category | undefined

  if (!storefront || !category) {
    return {
      title: 'دسته‌بندی یافت نشد',
      description: 'دسته‌بندی مورد نظر یافت نشد',
    }
  }

  // Extract image URL if available
  const imageUrl = category.smallCategoryImage
    ? typeof category.smallCategoryImage === 'object'
      ? (category.smallCategoryImage as Media).url
      : null
    : null

  return {
    title: `${category.name} | ${storefront.name}`,
    description:
      category.description || `مشاهده محصولات ${category.name} در فروشگاه ${storefront.name}`,
    openGraph: {
      title: `${category.name} | ${storefront.name}`,
      description:
        category.description || `مشاهده محصولات ${category.name} در فروشگاه ${storefront.name}`,
      type: 'website',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 800,
              height: 600,
              alt: category.name,
            },
          ]
        : [],
    },
  }
}

export default async function StoreCategoryPage({ params }: StoreCategoryPageProps) {
  const { slug, categorySlug } = await params
  const payload = await getPayload({ config })

  // Get current user
  const { user } = await getMeUser()

  // Find storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })

  const storefront = storefronts.docs[0]

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

  // Find category and verify it belongs to this store
  const categoryResult = await payload.find({
    collection: 'categories',
    where: {
      and: [
        { slug: { equals: decodeURIComponent(categorySlug) } },
        { stores: { contains: storefront.id } },
      ],
    },
    limit: 1,
  })

  const category = categoryResult.docs[0] as Category | undefined

  if (!category) {
    notFound()
  }

  // Get products in this category for this store
  const products = await payload.find({
    collection: 'products',
    where: {
      and: [
        { stores: { contains: storefront.id } },
        { categories: { contains: category.id } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 12,
    sort: 'displayOrder',
    depth: 1,
  })

  // Get all storefront categories for navbar
  const allCategories = await payload.find({
    collection: 'categories',
    where: {
      and: [{ stores: { contains: storefront.id } }, { showInMenu: { equals: true } }],
    },
    sort: 'displayOrder',
    limit: 50,
  })

  return (
    <>
      <StoreNavbar storefront={storefront} categories={allCategories.docs} user={user} />
      <main>
        <StoreCategoryClient
          storefront={storefront}
          category={category}
          initialProducts={products.docs}
          totalProducts={products.totalDocs}
        />
      </main>
      <StoreFooter storefront={storefront} categories={allCategories.docs} />
    </>
  )
}
