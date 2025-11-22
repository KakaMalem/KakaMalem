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
    <div className="lg:hidden border-b border-base-200">
      {/* Main Mobile Navbar */}
      <div className="bg-base-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile Menu Button */}
            <div className="dropdown">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                title="Menu"
              >
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
                className="dropdown-content z-10 menu p-2 shadow-xl bg-base-100 rounded-xl w-56 mt-2 border border-base-200"
              >
                {accountMenuItems.map((item, index) =>
                  item.isDivider ? (
                    <div key={index} className="divider my-1"></div>
                  ) : item.href ? (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`text-sm py-2.5 px-3 hover:bg-base-200 rounded-lg ${
                          item.isBold ? 'font-semibold' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <Logo variant="mobile" />
            </div>

            {/* Cart */}
            <CartButton />
          </div>

          {/* Search Bar */}
          <div className="mt-3">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Mobile Categories Bar */}
      <div className="sticky top-0 z-40 bg-base-100">
        <div className="py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4">
            <Link
              href="/shop"
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                pathname === '/shop'
                  ? 'bg-primary text-primary-content shadow-md scale-105'
                  : 'bg-base-200 text-base-content hover:bg-base-300 hover:scale-105'
              }`}
            >
              All Products
            </Link>
            {categories
              .filter((cat) => cat.value !== 'all')
              .map((category) => {
                const isActive = pathname === `/${category.slug}`
                return (
                  <Link
                    key={category.value}
                    href={`/${category.slug}`}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-md scale-105'
                        : 'bg-base-200 text-base-content hover:bg-base-300 hover:scale-105'
                    }`}
                  >
                    {category.label}
                  </Link>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
