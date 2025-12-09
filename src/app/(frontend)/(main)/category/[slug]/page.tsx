import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import CategoryPageClient from './page.client'
import type { Category, Product } from '@/payload-types'

// Force dynamic rendering since we use Payload which accesses cookies
export const dynamic = 'force-dynamic'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

interface ApiResponse {
  success?: boolean
  products?: Product[]
  docs?: Product[]
  pagination?: {
    totalPages?: number
    page?: number
    totalDocs?: number
  }
  totalPages?: number
  page?: number
  totalDocs?: number
}

export default async function CategoryPage({
  params,
  searchParams: _searchParams,
}: CategoryPageProps) {
  const { slug } = await params
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

  // Fetch products using search-products endpoint to get default variant data
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const url = new URL('/api/search-products', base)
  // Use the category ID (match what the client uses for pagination)
  url.searchParams.set('category', category.id)
  url.searchParams.set('page', '1')
  url.searchParams.set('limit', '12')

  let productsResult: {
    products: Product[]
    totalPages: number
    currentPage: number
    totalProducts: number
  }

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    const body: ApiResponse = await res.json()

    if (body.success && Array.isArray(body.products)) {
      productsResult = {
        products: body.products,
        totalPages: body.pagination?.totalPages ?? 0,
        currentPage: body.pagination?.page ?? 1,
        totalProducts: body.pagination?.totalDocs ?? 0,
      }
    } else if (Array.isArray(body.docs)) {
      productsResult = {
        products: body.docs,
        totalPages: body.totalPages ?? 0,
        currentPage: body.page ?? 1,
        totalProducts: body.totalDocs ?? 0,
      }
    } else {
      productsResult = {
        products: [],
        totalPages: 0,
        currentPage: 1,
        totalProducts: 0,
      }
    }
  } catch (error) {
    console.error('Error fetching products for category:', error)
    productsResult = {
      products: [],
      totalPages: 0,
      currentPage: 1,
      totalProducts: 0,
    }
  }

  return (
    <CategoryPageClient
      category={category}
      initialProducts={productsResult.products}
      totalProducts={productsResult.totalProducts}
      totalPages={productsResult.totalPages}
      currentPage={productsResult.currentPage}
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
