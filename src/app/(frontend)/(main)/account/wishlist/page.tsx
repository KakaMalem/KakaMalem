import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import WishlistClient from './page.client'
import { Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/wishlist',
  })

  // Fetch wishlist products
  let wishlistProducts: Product[] = []
  try {
    if (user.wishlist && Array.isArray(user.wishlist) && user.wishlist.length > 0) {
      const wishlistIds = user.wishlist
        .map((item) => (typeof item === 'string' ? item : item.id))
        .filter(Boolean)

      if (wishlistIds.length > 0) {
        const productsRes = await fetch(
          `${getServerSideURL()}/api/products?where[id][in]=${wishlistIds.join(',')}&depth=1`,
          { cache: 'no-store' },
        )

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          wishlistProducts = productsData.docs || []
        }
      }
    }
  } catch (error) {
    console.error('Error fetching wishlist products:', error)
  }

  return <WishlistClient products={wishlistProducts} />
}
