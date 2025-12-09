import React from 'react'
import MobileNavbar from './MobileNavbar'
import DesktopNavbar from './DesktopNavbar'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category, User } from '@/payload-types'
import { getMeUser } from '@/utilities/getMeUser'

export interface CategoryItem {
  value: string
  label: string
  slug: string
  displayOrder?: number
  image?: string | null
}

async function Navbar() {
  const payload = await getPayload({ config })
  let user: User | null = null

  // 1. Fetch the authenticated user
  try {
    const authResult = await getMeUser()
    user = authResult?.user
  } catch (error) {
    console.error('❌ Error fetching user:', error)
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
    ...categoriesData.docs.map((category: Category) => {
      const categoryImage = category.categoryImage
      const imageSrc =
        typeof categoryImage === 'string'
          ? categoryImage
          : typeof categoryImage === 'object' && categoryImage?.url
            ? categoryImage.url
            : null

      return {
        value: category.slug,
        label: category.name,
        slug: category.slug,
        displayOrder: category.displayOrder || 0,
        image: imageSrc,
      }
    }),
  ]

  return (
    <nav
      className="relative z-[60] text-base-content overflow-visible"
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

      <div className="relative z-20">
        <MobileNavbar categories={categories} user={user} />
        <DesktopNavbar categories={categories} user={user} />
      </div>
    </nav>
  )
}

export default Navbar
