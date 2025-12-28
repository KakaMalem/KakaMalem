import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import ProductsClient from './ProductsClient'
import type { Storefront } from '@/payload-types'

export default async function DashboardProductsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/products',
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

  const storefront = storefronts.docs[0] as Storefront | undefined

  // Get user's products - query by storefront if exists, otherwise by seller
  // Sort by displayOrder (ascending) for custom ordering
  const products = storefront
    ? await payload.find({
        collection: 'products',
        where: {
          stores: { contains: storefront.id },
        },
        limit: 100,
        sort: 'displayOrder',
        depth: 1,
      })
    : await payload.find({
        collection: 'products',
        where: {
          seller: { equals: user.id },
        },
        limit: 100,
        sort: 'displayOrder',
        depth: 1,
      })

  return <ProductsClient initialProducts={products.docs} storefront={storefront || null} />
}
