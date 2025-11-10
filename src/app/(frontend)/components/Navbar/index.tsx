import React from 'react'
import MobileNavbar from './MobileNavbar'
import DesktopNavbar from './DesktopNavbar'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category, User } from '@/payload-types'
import { cookies } from 'next/headers'

export interface CategoryItem {
  value: string
  label: string
  slug: string
  displayOrder?: number
}

async function Navbar() {
  const payload = await getPayload({ config })
  let user: User | null = null

  // 1. Fetch the authenticated user
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (token) {
      // Build the absolute URL for the API request
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      const host = process.env.NEXT_PUBLIC_SERVER_URL || 'localhost:3000'
      const apiUrl = `${protocol}://${host}/api/users/me`

      const meUserReq = await fetch(apiUrl, {
        headers: {
          Authorization: `JWT ${token}`,
        },
        cache: 'no-store', // Don't cache this request
      })

      if (meUserReq.ok) {
        const data = await meUserReq.json()
        user = data.user || null
      }
    }
  } catch (error) {
    console.error('❌ Error fetching user:', error)
    // User remains null
  }

  // 2. Fetch categories
  const categoriesData = await payload.find({
    collection: 'categories',
    where: {
      and: [{ status: { equals: 'active' } }, { showInMenu: { equals: true } }],
    },
    sort: 'displayOrder',
    limit: 100,
  })

  // Transform Payload data to our navbar format
  const categories: CategoryItem[] = [
    { value: 'all', label: 'All Products', slug: 'all', displayOrder: -1 },
    ...categoriesData.docs.map((category: Category) => ({
      value: category.slug,
      label: category.name,
      slug: category.slug,
      displayOrder: category.displayOrder || 0,
    })),
  ]

  return (
    <nav
      className="relative bg-base-300 text-base-content overflow-visible z-[60]"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Decorative elements */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary/8 to-accent/8 z-0 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10 pointer-events-none"
        aria-hidden
      />

      {/* Pass user prop to children */}
      <div className="relative z-20">
        <MobileNavbar categories={categories} user={user} />

        <DesktopNavbar categories={categories} user={user} />
      </div>
    </nav>
  )
}

export default Navbar
