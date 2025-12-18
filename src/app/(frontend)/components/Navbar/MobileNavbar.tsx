'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

  // Logic to show/hide categories based on route
  // Hide categories on: product pages, account pages, and footer link pages
  const footerPages = ['/terms', '/privacy', '/help', '/shipping', '/contact', '/faqs']
  const shouldRenderCategories = pathname
    ? !pathname.startsWith('/product/') &&
      !pathname.startsWith('/account') &&
      !footerPages.includes(pathname)
    : false

  // --- DIMENSIONS ---
  // Fixed Top Bar: Row 1 (Logo/Menu ~50px) + Row 2 (Search ~50px) + Padding ~20px = 120px
  const MOBILE_TOP_BAR_HEIGHT_PX = 120

  // Category Bar: Icon + Text + Padding = ~110px
  const MOBILE_CATEGORY_BAR_HEIGHT_PX = 110

  // --- SCROLL HANDLER ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Threshold: prevent jitter on tiny movements
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return

      // Scroll Down -> Hide Categories
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsCategoryBarVisible(false)
      }
      // Scroll Up -> Show Categories
      else {
        setIsCategoryBarVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="lg:hidden">
      {/* 1. SPACER 
         Prevents content from being hidden behind the fixed header.
      */}
      <div
        style={{
          height: shouldRenderCategories
            ? `${MOBILE_TOP_BAR_HEIGHT_PX + MOBILE_CATEGORY_BAR_HEIGHT_PX}px`
            : `${MOBILE_TOP_BAR_HEIGHT_PX}px`,
        }}
      />

      {/* 2. HEADER CONTAINER */}
      <div className="fixed top-0 left-0 right-0 z-50">
        {/* --- FIXED TOP BAR (Menu, Logo, Search) --- */}
        {/* z-50 ensures it stays on top of the sliding category bar */}
        <div
          className="relative z-50 bg-base-100 border-b border-base-200 shadow-sm"
          style={{ height: `${MOBILE_TOP_BAR_HEIGHT_PX}px` }}
        >
          <div className="flex flex-col justify-center h-full px-4 pb-2">
            {/* Row 1: Menu - Logo - Cart */}
            <div className="flex items-center justify-between gap-3 h-[60px]">
              {/* Mobile Menu Button */}
              <div className="dropdown dropdown-start dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                  title="Menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="dropdown-content z-[70] menu menu-compact p-2 shadow-xl bg-base-100 rounded-box w-64 mt-3 border border-base-200"
                >
                  {accountMenuItems.map((item, index) =>
                    item.isDivider ? (
                      <div key={index} className="divider my-1"></div>
                    ) : item.href ? (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className={`text-base py-3 px-4 hover:bg-base-200 rounded-lg ${
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

            {/* Row 2: Search Bar */}
            <div className="h-[40px] flex items-center">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* --- SLIDING CATEGORY BAR --- */}
        {/* z-40 ensures it slides BEHIND the Top Bar */}
        {shouldRenderCategories && (
          <div
            className={`
              absolute left-0 right-0 bg-base-100 border-b border-base-200 shadow-sm z-40
              transition-all duration-300 ease-in-out origin-top
            `}
            // ^ CHANGED: 'transition-transform' -> 'transition-all' for smooth opacity fade
            style={{
              top: `${MOBILE_TOP_BAR_HEIGHT_PX}px`, // Starts exactly below top bar
              height: `${MOBILE_CATEGORY_BAR_HEIGHT_PX}px`,
              // Logic: Slide UP (-100%) to hide behind top bar, slide DOWN (0) to show
              transform: isCategoryBarVisible ? 'translateY(0)' : 'translateY(-100%)',
              opacity: isCategoryBarVisible ? 1 : 0,
              pointerEvents: isCategoryBarVisible ? 'auto' : 'none',
            }}
          >
            <div className="h-full py-2">
              <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar px-4 h-full">
                {/* 'All Products' Link */}
                <Link
                  href="/"
                  className="group flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 flex-shrink-0 min-w-[70px]"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center ring-2 transition-all ${
                      pathname === '/'
                        ? 'ring-primary ring-offset-2 ring-offset-base-100'
                        : 'ring-base-300 active:ring-base-content/30'
                    }`}
                  >
                    <svg
                      className="w-6 h-6 text-base-content"
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
                    className={`text-xs font-semibold whitespace-nowrap leading-tight transition-colors ${
                      pathname === '/' ? 'text-primary' : 'text-base-content'
                    }`}
                  >
                    همه محصولات
                  </span>
                </Link>

                {/* Categories */}
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
                        className="group flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 flex-shrink-0 min-w-[70px]"
                      >
                        {category.image ? (
                          <div
                            className={`relative w-14 h-14 rounded-full overflow-hidden ring-2 transition-all ${
                              isActive
                                ? 'ring-primary ring-offset-2 ring-offset-base-100'
                                : 'ring-base-300 active:ring-base-content/30'
                            }`}
                          >
                            <Image
                              src={category.image}
                              alt={category.label}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center ring-2 transition-all ${
                              isActive
                                ? 'ring-primary ring-offset-2 ring-offset-base-100'
                                : 'ring-base-300 active:ring-base-content/30'
                            }`}
                          >
                            <svg
                              className="w-6 h-6 text-base-content"
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
                          className={`text-xs font-semibold whitespace-nowrap leading-tight transition-colors ${
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
