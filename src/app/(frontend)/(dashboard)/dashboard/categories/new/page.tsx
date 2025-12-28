import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import CategoryForm from '../CategoryForm'

export default async function NewCategoryPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/categories/new',
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
    // Redirect to storefront setup if no storefront exists
    redirect('/dashboard/storefront')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/categories" className="btn btn-ghost btn-sm btn-square">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">دسته‌بندی جدید</h1>
          <p className="text-base-content/60 mt-1">افزودن دسته‌بندی جدید به فروشگاه</p>
        </div>
      </div>

      {/* Category Form */}
      <CategoryForm category={null} storefrontId={storefront.id} />
    </div>
  )
}
