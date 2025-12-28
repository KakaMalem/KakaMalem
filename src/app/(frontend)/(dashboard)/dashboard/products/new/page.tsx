import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductForm from '../ProductForm'

export default async function NewProductPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/products/new',
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

  // Get categories for this storefront
  const categories = storefront
    ? await payload.find({
        collection: 'categories',
        where: {
          stores: { contains: storefront.id },
        },
        limit: 100,
        sort: 'displayOrder',
      })
    : { docs: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products" className="btn btn-ghost btn-sm btn-square">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">محصول جدید</h1>
          <p className="text-base-content/60 mt-1">افزودن محصول جدید به فروشگاه</p>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm product={null} categories={categories.docs} storefrontId={storefront?.id} />
    </div>
  )
}
