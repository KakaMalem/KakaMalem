import React from 'react'
import MobileNavbar from './MobileNavbar'
import DesktopNavbar from './DesktopNavbar'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category } from '@/payload-types'

export interface CategoryItem {
  value: string
  label: string
  slug: string
  displayOrder?: number
}

async function Navbar() {
  const payload = await getPayload({ config })

  // Fetch categories directly from Payload
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
      {/* Background (decorative) — placed behind interactive content */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-primary/8 to-accent/8 z-0 pointer-events-none"
        aria-hidden
      />

      {/* Elegant Border Accent (decorative) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10 pointer-events-none"
        aria-hidden
      />

      {/* Mobile Navbar Component — interactive content above decorations */}
      <div className="relative z-20">
        <MobileNavbar categories={categories} />
      </div>

      {/* Desktop Navbar Component — interactive content above decorations */}
      <div className="relative z-20">
        <DesktopNavbar categories={categories} />
      </div>
    </nav>
  )
}

export default Navbar
