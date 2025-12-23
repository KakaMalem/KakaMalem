'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { getAccountMenuItems, type IconType } from './constants'
import Logo from '../Logo'
import SearchBar from './SearchBar'
import type { CategoryItem } from '.'
import type { User } from '@/payload-types'
import CartButton from './CartButton'

const MenuIcon = ({ type, className = 'w-5 h-5' }: { type: IconType; className?: string }) => {
  const icons: Record<IconType, React.ReactNode> = {
    user: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    orders: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
    ),
    heart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
    settings: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    logout: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
    ),
    login: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
    ),
    register: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
      </svg>
    ),
    admin: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  }
  return <>{icons[type]}</>
}

const UserAvatar = ({
  user,
  size = 'md',
  showRing = true,
}: {
  user: User | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showRing?: boolean
}) => {
  const [imgError, setImgError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const sizePx = { xs: 24, sm: 32, md: 40, lg: 48 }

  const oauthPicture = user?.picture
  const initial = (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()

  const ringClasses = showRing ? 'ring-2 ring-base-200 ring-offset-1 ring-offset-base-100' : ''

  // Reset error state when user changes
  useEffect(() => {
    setImgError(false)
  }, [user?.id, user?.picture])

  // Try OAuth picture first, fallback to initials
  if (oauthPicture && !imgError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${ringClasses}`}
      >
        <Image
          src={oauthPicture}
          alt={user?.firstName || 'User'}
          width={sizePx[size]}
          height={sizePx[size]}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center font-medium text-base-content flex-shrink-0 ${ringClasses}`}
    >
      {initial}
    </div>
  )
}

interface MobileNavbarProps {
  categories: CategoryItem[]
  user: User | null
}

export default function MobileNavbar({ categories, user }: MobileNavbarProps) {
  const pathname = usePathname()

  // State for scroll logic
  const [isCategoryBarVisible, setIsCategoryBarVisible] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const lastScrollY = useRef(0)

  const friendlyName = user?.firstName || user?.email?.split('@')[0]
  const userRoles = user?.roles as string[] | undefined
  const accountMenuItems = getAccountMenuItems(
    !!user,
    friendlyName,
    pathname || undefined,
    userRoles,
    user?.email,
  )

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

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
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
                title="Menu"
                aria-expanded={isMenuOpen}
                aria-label="منو"
              >
                <svg
                  className={`w-6 h-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
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

        {/* --- FULL-WIDTH SLIDE-DOWN MENU --- */}
        <div
          className={`
            absolute left-0 right-0 z-[60] bg-base-100 border-b border-base-200 shadow-lg
            transition-all duration-300 ease-out origin-top
          `}
          style={{
            top: `${MOBILE_TOP_BAR_HEIGHT_PX}px`,
            transform: isMenuOpen ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isMenuOpen ? 1 : 0,
            pointerEvents: isMenuOpen ? 'auto' : 'none',
          }}
        >
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Menu Content */}
            <div className="menu menu-lg w-full p-0">
              {accountMenuItems.map((item, index) => {
                if (item.isDivider) {
                  return <div key={index} className="divider my-1 mx-4" />
                }

                if (item.isHeader) {
                  return (
                    <div key={index} className="px-4 py-4 bg-base-200/50">
                      <div className="flex items-center gap-4">
                        <UserAvatar user={user} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base-content text-lg truncate">
                            {item.label}
                          </p>
                          {item.subtitle && (
                            <p className="text-sm text-base-content/60 truncate">{item.subtitle}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                if (item.href) {
                  const isLogout = item.href === '/auth/logout'
                  return (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className={`
                          flex items-center gap-4 px-4 py-4 rounded-none
                          transition-colors duration-150 active:bg-base-200
                          ${isLogout ? 'text-error hover:bg-error/10' : 'hover:bg-base-200'}
                          ${item.isBold ? 'font-semibold' : ''}
                        `}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.icon && (
                          <span className={isLogout ? 'text-error' : 'text-base-content/70'}>
                            <MenuIcon type={item.icon} />
                          </span>
                        )}
                        <span className="text-base">{item.label}</span>
                      </Link>
                    </li>
                  )
                }

                return null
              })}
            </div>
          </div>
        </div>

        {/* --- BACKDROP OVERLAY --- */}
        <div
          className={`
            fixed inset-0 bg-black/20 backdrop-blur-sm z-[55]
            transition-opacity duration-300
            ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          style={{ top: `${MOBILE_TOP_BAR_HEIGHT_PX}px` }}
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />

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
