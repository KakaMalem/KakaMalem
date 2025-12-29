import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import VariantEditForm from './VariantEditForm'
import type { Product, ProductVariant } from '@/payload-types'

interface VariantEditPageProps {
  params: Promise<{ id: string; variantId: string }>
}

export default async function VariantEditPage({ params }: VariantEditPageProps) {
  const { id, variantId } = await params
  const { user } = await getMeUser({
    nullUserRedirect: `/auth/login?redirect=/dashboard/products/${id}/variants/${variantId}`,
  })
  const payload = await getPayload({ config })

  // Get the product
  let product: Product | null = null
  try {
    product = await payload.findByID({
      collection: 'products',
      id,
      depth: 1,
    })
  } catch {
    notFound()
  }

  if (!product) {
    notFound()
  }

  // Get user's storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    limit: 1,
  })

  const storefront = storefronts.docs[0]

  // Verify ownership
  const sellerId = typeof product.seller === 'object' ? product.seller?.id : product.seller
  const productStoreIds = product.stores
    ? Array.isArray(product.stores)
      ? product.stores.map((s) => (typeof s === 'object' && s !== null ? s.id : s))
      : []
    : []
  const ownsViaSeller = sellerId === user.id
  const ownsViaStorefront = storefront && productStoreIds.includes(storefront.id)

  if (!ownsViaSeller && !ownsViaStorefront) {
    const isAdmin =
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer')
    if (!isAdmin) {
      notFound()
    }
  }

  // Get the variant
  let variant: ProductVariant | null = null
  try {
    variant = await payload.findByID({
      collection: 'product-variants',
      id: variantId,
      depth: 2,
    })
  } catch {
    notFound()
  }

  if (!variant) {
    notFound()
  }

  // Verify variant belongs to this product
  const variantProductId =
    typeof variant.product === 'object' ? variant.product?.id : variant.product
  if (variantProductId !== product.id) {
    notFound()
  }

  const variantTitle = variant.options?.map((o) => o.value).join(' / ') || 'تنوع'

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <Link
            href={`/dashboard/products/${id}?tab=variants`}
            className="btn btn-ghost btn-sm btn-square flex-shrink-0"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">ویرایش تنوع</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
              <span className="text-sm sm:text-base text-base-content/60 truncate">
                {product.name}
              </span>
              <span className="text-base-content/40 hidden sm:inline">•</span>
              <span className="text-sm sm:text-base font-medium truncate">{variantTitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Edit Form */}
      <VariantEditForm
        variant={variant}
        productId={product.id}
        productPrice={product.price}
        productSalePrice={product.salePrice ?? undefined}
      />
    </div>
  )
}
