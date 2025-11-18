'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getAccountMenuItems } from './constants'
import Logo from '../Logo'
import SearchBar from './SearchBar'
import type { CategoryItem } from '.'
import type { User } from '@/payload-types'
import CartButton from './CartButton'

interface MobileNavbarProps {
  categories: CategoryItem[]
  user: User | null
}

export default function MobileNavbar({ categories, user }: MobileNavbarProps) {
  const pathname = usePathname()

  // Generate menu items based on auth status
  const friendlyName = user?.firstName || user?.email
  const userRoles = user?.roles as string[] | undefined
  const accountMenuItems = getAccountMenuItems(
    !!user,
    friendlyName,
    pathname || undefined,
    userRoles,
  )

  return (
    <div className="lg:hidden">
      {/* Main Mobile Navbar */}
      <div className="bg-base-100 border-b border-base-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm" title="Menu">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-lg w-52"
              >
                {accountMenuItems.map((item, index) =>
                  item.isDivider ? (
                    <div key={index} className="divider my-0"></div>
                  ) : item.href ? (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`text-sm py-2 hover:bg-base-200 rounded-md ${
                          item.isBold ? 'font-medium' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>

            {/* Logo & Cart */}
            <Logo variant="mobile" />
            <CartButton />
          </div>

          {/* Search Bar */}
          <div className="mt-3">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Categories Bar */}
      <div className="bg-base-200/80 backdrop-blur-sm border-b border-base-300">
        <div className="py-2">
          <div className="flex items-center space-x-6 overflow-x-auto hide-scrollbar px-4">
            <Link
              href="/shop"
              className="text-sm text-base-content hover:text-primary transition-colors whitespace-nowrap font-medium"
            >
              All Products
            </Link>
            {categories
              .filter((cat) => cat.value !== 'all')
              .map((category) => (
                <Link
                  key={category.value}
                  href={`/shop?${category.slug}`}
                  className="text-sm text-base-content/80 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {category.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
