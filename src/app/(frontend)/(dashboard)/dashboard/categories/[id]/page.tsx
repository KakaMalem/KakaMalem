import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowRight, Eye, ExternalLink } from 'lucide-react'
import CategoryForm from '../CategoryForm'
import type { Category, Storefront } from '@/payload-types'

interface EditCategoryPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params
  const { user } = await getMeUser({
    nullUserRedirect: `/auth/login?redirect=/dashboard/categories/${id}`,
  })
  const payload = await getPayload({ config })

  // Get user's storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    limit: 1,
  })

  const storefront = storefronts.docs[0]

  if (!storefront) {
    redirect('/dashboard/storefront')
  }

  // Get the category
  let category: Category | null = null
  try {
    category = await payload.findByID({
      collection: 'categories',
      id,
      depth: 2,
    })
  } catch {
    notFound()
  }

  if (!category) {
    notFound()
  }

  // Verify ownership (category belongs to user's storefront)
  const categoryStoreIds = category.stores
    ? Array.isArray(category.stores)
      ? category.stores.map((s) => (typeof s === 'object' ? (s as Storefront).id : s))
      : []
    : []

  if (!categoryStoreIds.includes(storefront.id)) {
    // Check if user is admin
    const isAdmin =
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer')
    if (!isAdmin) {
      notFound()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/categories" className="btn btn-ghost btn-sm btn-square">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">ویرایش دسته‌بندی</h1>
            <p className="text-base-content/60 mt-1">{category.name}</p>
          </div>
        </div>
        <Link
          href={`/store/${storefront.slug}/category/${category.slug}`}
          target="_blank"
          className="btn btn-ghost gap-2"
        >
          <Eye className="w-4 h-4" />
          مشاهده دسته‌بندی
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Category Form */}
      <CategoryForm category={category} storefrontId={storefront.id} />
    </div>
  )
}
