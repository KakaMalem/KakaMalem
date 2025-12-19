'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { getAccountMenuItems, type IconType } from './constants'
import type { User } from '@/payload-types'

interface ProfileDropdownProps {
  user: User | null
}

const MenuIcon = ({ type, className = 'w-4 h-4' }: { type: IconType; className?: string }) => {
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

// Generate Gravatar URL from email using a simple hash
// Gravatar requires MD5, but we use a base64 encoding as approximation
// d=404 returns 404 if no gravatar exists, allowing proper fallback to initials
const getGravatarUrl = (email: string, size: number = 80): string => {
  const hash = email.trim().toLowerCase()
  return `https://www.gravatar.com/avatar/${btoa(hash).slice(0, 32)}?s=${size}&d=404`
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
  const [gravatarError, setGravatarError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const sizePx = { xs: 24, sm: 32, md: 40, lg: 48 }

  // Priority: 1. OAuth picture, 2. Gravatar, 3. Initials
  const oauthPicture = user?.picture
  const email = user?.email
  const gravatarUrl = email ? getGravatarUrl(email, sizePx[size] * 2) : null
  const initial = (user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()

  const ringClasses = showRing ? 'ring-2 ring-base-200 ring-offset-1 ring-offset-base-100' : ''

  // Reset error states when user changes
  useEffect(() => {
    setImgError(false)
    setGravatarError(false)
  }, [user?.id, user?.picture, user?.email])

  // Try OAuth picture first
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

  // Try Gravatar second
  if (gravatarUrl && !gravatarError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${ringClasses}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gravatarUrl}
          alt={user?.firstName || 'User'}
          width={sizePx[size]}
          height={sizePx[size]}
          className="w-full h-full object-cover"
          onError={() => setGravatarError(true)}
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

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const friendlyName = user?.firstName || user?.email?.split('@')[0]
  const userRoles = user?.roles as string[] | undefined
  const accountMenuItems = getAccountMenuItems(
    !!user,
    friendlyName,
    pathname || undefined,
    userRoles,
    user?.email,
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 relative"
        title="حساب کاربری"
      >
        {user ? (
          <UserAvatar user={user} size="xs" showRing={false} />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute left-0 mt-2 origin-top-left w-64
          bg-base-100 rounded-xl shadow-lg border border-base-200/80
          transition-all duration-200 ease-out
          ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }
        `}
        style={{ zIndex: 70 }}
      >
        <div className="py-2">
          {accountMenuItems.map((item, index) => {
            if (item.isDivider) {
              return <div key={index} className="my-2 border-t border-base-200/60" />
            }

            if (item.isHeader) {
              return (
                <div key={index} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base-content truncate">{item.label}</p>
                      {item.subtitle && (
                        <p className="text-xs text-base-content/60 truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            if (item.href) {
              const isLogout = item.href === '/auth/logout'
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`
                    flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg
                    transition-all duration-150
                    ${
                      isLogout
                        ? 'text-error/80 hover:text-error hover:bg-error/10'
                        : 'text-base-content/80 hover:text-base-content hover:bg-base-200/60'
                    }
                    ${item.isBold ? 'font-medium' : ''}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon && (
                    <span className="opacity-70">
                      <MenuIcon type={item.icon} />
                    </span>
                  )}
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
