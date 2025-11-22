import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import CategoryPageClient from './page.client'
import type { Category } from '@/payload-types'

interface CategoryPageProps {
  params: Promise<{ category: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params
  const payload = await getPayload({ config })

  // Fetch the category
  const categoryResult = await payload.find({
    collection: 'categories',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
  })

  if (!categoryResult.docs.length) {
    notFound()
  }

  const category = categoryResult.docs[0] as Category

  // Fetch products in this category with pagination
  const productsResult = await payload.find({
    collection: 'products',
    where: {
      and: [{ status: { equals: 'published' } }, { categories: { contains: category.id } }],
    },
    page: 1,
    limit: 12,
    depth: 2,
  })

  return (
    <CategoryPageClient
      category={category}
      initialProducts={productsResult.docs}
      totalProducts={productsResult.totalDocs}
      totalPages={productsResult.totalPages}
      currentPage={productsResult.page || 1}
    />
  )
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const categories = await payload.find({
    collection: 'categories',
    where: {
      status: { equals: 'active' },
    },
    limit: 100,
  })

  return categories.docs.map((category) => ({
    slug: category.slug,
  }))
}
