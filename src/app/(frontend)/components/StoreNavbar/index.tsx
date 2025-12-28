'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import StoreLogo from '../StoreLogo'
import SearchBar from '../Navbar/SearchBar'
import CartButton from '../Navbar/CartButton'
import ProfileDropdown from '../Navbar/ProfileDropdown'
import type { Storefront, Category, User, Media } from '@/payload-types'

interface StoreCategoryItem {
  id: string
  name: string
  slug: string | null | undefined
  image?: string | null
}

interface StoreNavbarProps {
  storefront: Storefront
  categories: Category[]
  user: User | null
}

export default function StoreNavbar({ storefront, categories, user }: StoreNavbarProps) {
  const pathname = usePathname()

  // State for scroll logic
  const [isCategoryBarVisible, setIsCategoryBarVisible] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  // Transform categories to simple format
  const categoryItems: StoreCategoryItem[] = categories.map((cat) => {
    const imageMedia =
      cat.smallCategoryImage && typeof cat.smallCategoryImage === 'object'
        ? (cat.smallCategoryImage as Media)
        : null
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: imageMedia?.url || null,
    }
  })

  // --- DIMENSIONS (match main navbar) ---
  const TOP_BAR_HEIGHT_PX = 80
  const CATEGORY_BAR_HEIGHT_PX = categoryItems.length > 0 ? 145 : 0
  const MOBILE_TOP_BAR_HEIGHT_PX = 120
  const MOBILE_CATEGORY_BAR_HEIGHT_PX = categoryItems.length > 0 ? 110 : 0

  // --- SCROLL HANDLER ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsCategoryBarVisible(false)
      } else {
        setIsCategoryBarVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const storeBaseUrl = `/store/${storefront.slug}`

  // Check if we're on a category page by examining the pathname
  // Pattern: /store/[slug]/category/[categorySlug]
  const getCategorySlugFromPath = (): string | null => {
    const match = pathname.match(/^\/store\/[^/]+\/category\/([^/]+)/)
    return match ? decodeURIComponent(match[1]) : null
  }
  const currentCategorySlug = getCategorySlugFromPath()

  return (
    <nav
      className="relative z-[60] text-base-content overflow-visible"
      role="navigation"
      aria-label="Store navigation"
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

      {/* DESKTOP VERSION */}
      <div className="hidden lg:block relative z-20">
        {/* Spacer */}
        <div
          style={{
            height: `${TOP_BAR_HEIGHT_PX + CATEGORY_BAR_HEIGHT_PX}px`,
          }}
        />

        {/* Header Container */}
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-auto">
          {/* Top Bar */}
          <div
            className="relative z-50 bg-base-100 border-b border-base-200 shadow-sm"
            style={{ height: `${TOP_BAR_HEIGHT_PX}px` }}
          >
            <div className="max-w-7xl mx-auto px-6 h-full">
              <div className="flex items-center justify-between gap-8 h-full">
                {/* Store Logo */}
                <div className="flex-shrink-0 flex items-center">
                  <StoreLogo storefront={storefront} variant="desktop" />
                </div>

                {/* Search - scoped to this store */}
                <div className="flex-1 max-w-2xl">
                  <SearchBar storeSlug={storefront.slug || undefined} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <CartButton />
                  <ProfileDropdown user={user} />
                </div>
              </div>
            </div>
          </div>

          {/* Category Bar */}
          {categoryItems.length > 0 && (
            <div
              className={`
                absolute left-0 right-0 bg-base-100 border-b border-base-200 shadow-sm z-40
                transition-all duration-300 ease-in-out origin-top
              `}
              style={{
                top: `${TOP_BAR_HEIGHT_PX}px`,
                height: `${CATEGORY_BAR_HEIGHT_PX}px`,
                transform: isCategoryBarVisible ? 'translateY(0)' : 'translateY(-100%)',
                opacity: isCategoryBarVisible ? 1 : 0,
                pointerEvents: isCategoryBarVisible ? 'auto' : 'none',
              }}
            >
              <div className="max-w-7xl mx-auto px-8 py-4 h-full">
                <div className="flex items-center gap-8 overflow-x-auto hide-scrollbar h-full">
                  {/* All Products Link */}
                  <Link
                    href={storeBaseUrl}
                    className="group flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-105 flex-shrink-0 h-full min-w-[80px]"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ring-2 transition-all ${
                        pathname === storeBaseUrl && !currentCategorySlug
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
                        pathname === storeBaseUrl && !currentCategorySlug
                          ? 'text-primary'
                          : 'text-base-content'
                      }`}
                    >
                      همه محصولات
                    </span>
                  </Link>

                  {/* Store Categories */}
                  {categoryItems.map((category) => {
                    const categoryUrl = `${storeBaseUrl}/category/${category.slug}`
                    const isActive = currentCategorySlug === category.slug

                    return (
                      <Link
                        key={category.id}
                        href={categoryUrl}
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
                              alt={category.name}
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
                          {category.name}
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

      {/* MOBILE VERSION */}
      <div className="lg:hidden relative z-20">
        {/* Spacer */}
        <div
          style={{
            height: `${MOBILE_TOP_BAR_HEIGHT_PX + MOBILE_CATEGORY_BAR_HEIGHT_PX}px`,
          }}
        />

        {/* Header Container */}
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-auto">
          {/* Top Bar */}
          <div
            className="relative z-50 bg-base-100 border-b border-base-200 shadow-sm"
            style={{ height: `${MOBILE_TOP_BAR_HEIGHT_PX}px` }}
          >
            <div className="flex flex-col justify-center h-full px-4 pb-2">
              {/* Row 1: Menu - Logo - Cart */}
              <div className="flex items-center justify-between gap-3 h-[60px]">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                  title="Menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-label="منو"
                >
                  <svg
                    className={`w-6 h-6 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isMobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    )}
                  </svg>
                </button>

                {/* Store Logo */}
                <div className="flex-1 flex justify-center">
                  <StoreLogo storefront={storefront} variant="mobile" />
                </div>

                {/* Cart */}
                <CartButton />
              </div>

              {/* Row 2: Search Bar - scoped to this store */}
              <div className="h-[40px] flex items-center">
                <SearchBar storeSlug={storefront.slug || undefined} />
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <div
            className={`
              fixed inset-0 bg-black/20 backdrop-blur-sm z-[55]
              transition-opacity duration-300
              ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}
            style={{ top: `${MOBILE_TOP_BAR_HEIGHT_PX}px` }}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu Content */}
          <div
            className={`
              absolute left-0 right-0 z-[60] bg-base-100 border-b border-base-200 shadow-lg
              transition-all duration-300 ease-out origin-top
            `}
            style={{
              top: `${MOBILE_TOP_BAR_HEIGHT_PX}px`,
              transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
              opacity: isMobileMenuOpen ? 1 : 0,
              pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
            }}
          >
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="menu menu-lg w-full p-0">
                {/* Back to KakaMalem */}
                <li>
                  <Link
                    href="/"
                    className="flex items-center gap-4 px-4 py-4 rounded-none hover:bg-base-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span className="text-base">بازگشت به کاکا معلم</span>
                  </Link>
                </li>
                <div className="divider my-1 mx-4" />
                {/* Store Info */}
                <div className="px-4 py-4 bg-base-200/50">
                  <div className="flex items-center gap-4">
                    <StoreLogo storefront={storefront} variant="compact" asSpan />
                  </div>
                  {storefront.tagline && (
                    <p className="text-sm text-base-content/60 mt-2">{storefront.tagline}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Bar */}
          {categoryItems.length > 0 && (
            <div
              className={`
                absolute left-0 right-0 bg-base-100 border-b border-base-200 shadow-sm z-40
                transition-all duration-300 ease-in-out origin-top
              `}
              style={{
                top: `${MOBILE_TOP_BAR_HEIGHT_PX}px`,
                height: `${MOBILE_CATEGORY_BAR_HEIGHT_PX}px`,
                transform: isCategoryBarVisible ? 'translateY(0)' : 'translateY(-100%)',
                opacity: isCategoryBarVisible ? 1 : 0,
                pointerEvents: isCategoryBarVisible ? 'auto' : 'none',
              }}
            >
              <div className="h-full py-2">
                <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar px-4 h-full">
                  {/* All Products */}
                  <Link
                    href={storeBaseUrl}
                    className="group flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95 flex-shrink-0 min-w-[70px]"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ring-2 transition-all ${
                        pathname === storeBaseUrl && !currentCategorySlug
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
                        pathname === storeBaseUrl && !currentCategorySlug
                          ? 'text-primary'
                          : 'text-base-content'
                      }`}
                    >
                      همه محصولات
                    </span>
                  </Link>

                  {/* Store Categories */}
                  {categoryItems.map((category) => {
                    const categoryUrl = `${storeBaseUrl}/category/${category.slug}`
                    const isActive = currentCategorySlug === category.slug

                    return (
                      <Link
                        key={category.id}
                        href={categoryUrl}
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
                              alt={category.name}
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
                          {category.name}
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
    </nav>
  )
}
