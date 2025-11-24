'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Headroom from 'react-headroom'
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

  const friendlyName = user?.firstName || user?.email
  const userRoles = user?.roles as string[] | undefined
  const accountMenuItems = getAccountMenuItems(
    !!user,
    friendlyName,
    pathname || undefined,
    userRoles,
  )

  // CHANGE: Removed "pathname !== '/'" from the condition.
  // Now it only hides on specific product pages or account pages.
  const shouldShowCategories = pathname
    ? !pathname.startsWith('/shop/') && !pathname.startsWith('/account')
    : false

  // Hardcoded height of the top bar
  const TOP_BAR_HEIGHT = '81px'

  return (
    <div className="hidden lg:block relative">
      {/* CSS Override for Headroom */}
      <style jsx global>{`
        .desktop-headroom-wrapper .headroom {
          z-index: 50 !important;
        }

        .desktop-headroom-wrapper .headroom--pinned,
        .desktop-headroom-wrapper .headroom--unfixed {
          transform: translateY(${TOP_BAR_HEIGHT}) !important;
          transition: transform 0.3s ease-in-out;
        }

        .desktop-headroom-wrapper .headroom--unpinned {
          transform: translateY(0) !important;
          transition: transform 0.3s ease-in-out;
        }
      `}</style>

      {/* 1. SPACER DIV */}
      <div style={{ height: TOP_BAR_HEIGHT }} />

      {/* 2. FIXED TOP BAR */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] bg-base-100 border-b border-base-200"
        style={{ height: TOP_BAR_HEIGHT }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex-shrink-0">
              <Logo variant="desktop" />
            </div>

            <div className="flex-1 max-w-2xl">
              <SearchBar />
            </div>

            <div className="flex items-center gap-2">
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
                  className="dropdown-content z-[70] menu p-2 shadow-xl bg-base-100 rounded-xl w-56 mt-2 border border-base-200"
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

              <CartButton />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY BAR (Headroom) */}
      {shouldShowCategories && (
        <Headroom
          className="desktop-headroom-wrapper"
          pinStart={0}
          upTolerance={10}
          downTolerance={10}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
          }}
        >
          <div className="bg-base-100 shadow-sm border-b border-base-200">
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
        </Headroom>
      )}
    </div>
  )
}
