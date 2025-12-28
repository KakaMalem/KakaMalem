import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Eye, ExternalLink } from 'lucide-react'
import ProductForm from '../ProductForm'
import type { Product } from '@/payload-types'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const { user } = await getMeUser({
    nullUserRedirect: `/auth/login?redirect=/dashboard/products/${id}`,
  })
  const payload = await getPayload({ config })

  // Get the product
  let product: Product | null = null
  try {
    product = await payload.findByID({
      collection: 'products',
      id,
      depth: 2,
    })
  } catch {
    notFound()
  }

  if (!product) {
    notFound()
  }

  // Get user's storefront first (needed for ownership check)
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    limit: 1,
  })

  const storefront = storefronts.docs[0]

  // Verify ownership - check both seller field AND storefront ownership
  const sellerId = typeof product.seller === 'object' ? product.seller?.id : product.seller
  const productStoreIds = product.stores
    ? Array.isArray(product.stores)
      ? product.stores.map((s) => (typeof s === 'object' && s !== null ? s.id : s))
      : []
    : []
  const ownsViaSeller = sellerId === user.id
  const ownsViaStorefront = storefront && productStoreIds.includes(storefront.id)

  if (!ownsViaSeller && !ownsViaStorefront) {
    // Check if user is admin
    const isAdmin =
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer')
    if (!isAdmin) {
      notFound()
    }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="btn btn-ghost btn-sm btn-square">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">ویرایش محصول</h1>
            <p className="text-base-content/60 mt-1">{product.name}</p>
          </div>
        </div>
        <Link
          href={
            storefront
              ? `/store/${storefront.slug}/product/${product.slug}`
              : `/product/${product.slug}`
          }
          target="_blank"
          className="btn btn-ghost gap-2"
        >
          <Eye className="w-4 h-4" />
          مشاهده محصول
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Product Form */}
      <ProductForm product={product} categories={categories.docs} storefrontId={storefront?.id} />
    </div>
  )
}
