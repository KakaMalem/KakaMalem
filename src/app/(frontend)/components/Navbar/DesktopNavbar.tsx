'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

  // State for scroll logic
  const [isCategoryBarVisible, setIsCategoryBarVisible] = useState(true)
  const lastScrollY = useRef(0)

  const friendlyName = user?.firstName || user?.email
  const userRoles = user?.roles as string[] | undefined
  const accountMenuItems = getAccountMenuItems(
    !!user,
    friendlyName,
    pathname || undefined,
    userRoles,
  )

  // Determine if we should render the category bar at all based on route
  // Hide categories on: product pages, account pages, and footer link pages
  const footerPages = ['/terms', '/privacy', '/help', '/shipping', '/contact', '/faqs']
  const shouldRenderCategories = pathname
    ? !pathname.startsWith('/product/') &&
      !pathname.startsWith('/account') &&
      !footerPages.includes(pathname)
    : false

  // --- DIMENSIONS ---
  const TOP_BAR_HEIGHT_PX = 80
  const CATEGORY_BAR_HEIGHT_PX = 145

  // --- SCROLL HANDLER ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Threshold: Don't toggle on tiny scrolls
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling DOWN -> Hide Category Bar
        setIsCategoryBarVisible(false)
      } else {
        // Scrolling UP -> Show Category Bar
        setIsCategoryBarVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="hidden lg:block">
      {/* 1. SPACER */}
      <div
        style={{
          height: shouldRenderCategories
            ? `${TOP_BAR_HEIGHT_PX + CATEGORY_BAR_HEIGHT_PX}px`
            : `${TOP_BAR_HEIGHT_PX}px`,
        }}
      />

      {/* 2. HEADER CONTAINER */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* --- TOP BAR (Logo, Search, Account) --- */}
        <div
          className="relative z-50 bg-base-100 border-b border-base-200 shadow-sm"
          style={{ height: `${TOP_BAR_HEIGHT_PX}px` }}
        >
          <div className="max-w-7xl mx-auto px-6 h-full">
            <div className="flex items-center justify-between gap-8 h-full">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Logo variant="desktop" />
              </div>

              {/* Search */}
              <div className="flex-1 max-w-2xl">
                <SearchBar />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <CartButton />

                <div className="dropdown dropdown-end dropdown-bottom">
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
                    className="dropdown-content z-[70] menu menu-compact p-2 shadow-xl bg-base-100 rounded-box w-56 mt-3 border border-base-200"
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
              </div>
            </div>
          </div>
        </div>

        {/* --- CATEGORY BAR (Slide Effect) --- */}
        {shouldRenderCategories && (
          <div
            className={`
              absolute left-0 right-0 bg-base-100 border-b border-base-200 shadow-sm z-40
              transition-all duration-300 ease-in-out origin-top
            `}
            // ^ CHANGED: 'transition-transform' -> 'transition-all' so it animates opacity too.
            style={{
              top: `${TOP_BAR_HEIGHT_PX}px`,
              height: `${CATEGORY_BAR_HEIGHT_PX}px`,
              // Slide up (-100%) tucks it behind the Top Bar.
              transform: isCategoryBarVisible ? 'translateY(0)' : 'translateY(-100%)',
              opacity: isCategoryBarVisible ? 1 : 0,
              pointerEvents: isCategoryBarVisible ? 'auto' : 'none',
            }}
          >
            <div className="max-w-7xl mx-auto px-8 py-4 h-full">
              <div className="flex items-center gap-8 overflow-x-auto hide-scrollbar h-full">
                <Link
                  href="/"
                  className="group flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0 h-full min-w-[80px]"
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ring-2 transition-all ${
                      pathname === '/'
                        ? 'ring-primary ring-offset-2 ring-offset-base-100'
                        : 'ring-base-300 hover:ring-base-content/30'
                    }`}
                  >
                    <svg
                      className="w-7 h-7 text-base-content"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap transition-colors ${
                      pathname === '/' ? 'text-primary' : 'text-base-content'
                    }`}
                  >
                    همه محصولات
                  </span>
                </Link>

                {categories
                  .filter((cat) => cat.value !== 'all')
                  .map((category) => {
                    // Decode pathname to handle Persian/Arabic characters in URLs
                    const decodedPathname = pathname ? decodeURIComponent(pathname) : ''
                    const isActive = decodedPathname === `/category/${category.slug}`
                    return (
                      <Link
                        key={category.value}
                        href={`/category/${category.slug}`}
                        className="group flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0 h-full min-w-[80px]"
                      >
                        {category.image ? (
                          <div
                            className={`relative w-16 h-16 rounded-full overflow-hidden ring-2 transition-all ${
                              isActive
                                ? 'ring-primary ring-offset-2 ring-offset-base-100'
                                : 'ring-base-300 group-hover:ring-base-content/30'
                            }`}
                          >
                            <Image
                              src={category.image}
                              alt={category.label}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center ring-2 transition-all ${
                              isActive
                                ? 'ring-primary ring-offset-2 ring-offset-base-100'
                                : 'ring-base-300 group-hover:ring-base-content/30'
                            }`}
                          >
                            <svg
                              className="w-7 h-7 text-base-content"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <span
                          className={`text-sm font-semibold whitespace-nowrap transition-colors ${
                            isActive ? 'text-primary' : 'text-base-content'
                          }`}
                        >
                          {category.label}
                        </span>
                      </Link>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
