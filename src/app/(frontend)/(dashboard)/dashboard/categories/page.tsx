import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import CategoriesClient from './CategoriesClient'

export default async function DashboardCategoriesPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/categories',
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

  // Get user's categories from unified Categories collection
  const categories = storefront
    ? await payload.find({
        collection: 'categories',
        where: {
          stores: { contains: storefront.id },
        },
        limit: 100,
        sort: 'displayOrder',
        depth: 2,
      })
    : { docs: [], totalDocs: 0 }

  // Count products in category
  const productCounts: Record<string, number> = {}
  if (storefront && categories.docs.length > 0) {
    // Get product counts for each category
    for (const cat of categories.docs) {
      const productResult = await payload.count({
        collection: 'products',
        where: {
          and: [{ stores: { contains: storefront.id } }, { categories: { contains: cat.id } }],
        },
      })
      productCounts[cat.id] = productResult.totalDocs
    }
  }

  return (
    <CategoriesClient
      initialCategories={categories.docs}
      productCounts={productCounts}
      storefrontSlug={storefront?.slug || null}
    />
  )
}
