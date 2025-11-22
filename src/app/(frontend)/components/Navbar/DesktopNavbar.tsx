'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getAccountMenuItems } from './constants'
import Logo from '../Logo'
import type { CategoryItem } from '.'
import SearchBar from './SearchBar'
import type { User } from '@/payload-types'
import CartButton from './CartButton'

interface DesktopNavbarProps {
  categories: CategoryItem[]
  user: User | null
}

export default function DesktopNavbar({ categories, user }: DesktopNavbarProps) {
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
    <div className="hidden lg:block border-b border-base-200">
      {/* Top bar */}
      <div className="bg-base-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo variant="desktop" />
            </div>

            {/* SearchBar - Centered and flexible */}
            <div className="flex-1 max-w-2xl">
              <SearchBar />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Account */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                  title="Account"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
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

              {/* Cart */}
              <CartButton />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-0 z-40 bg-base-100">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <Link
              href="/shop"
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                pathname === '/shop'
                  ? 'bg-primary text-primary-content shadow-md'
                  : 'bg-base-200 text-base-content hover:bg-base-300'
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
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-md'
                        : 'bg-base-200 text-base-content hover:bg-base-300'
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
