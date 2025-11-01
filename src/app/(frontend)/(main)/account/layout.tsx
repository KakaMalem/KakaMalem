'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, Heart, MapPin, Settings, LogOut } from 'lucide-react'
import { getMockUser } from '@/lib/mockUser'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/account'
  const user = getMockUser()

  const isActive = (path: string) =>
    pathname === path || (path !== '/account' && pathname?.startsWith(path))

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4">
            <div className="avatar avatar-placeholder">
              <div className="bg-neutral text-neutral-content w-24 rounded-full flex items-center justify-center">
                <span className="text-3xl leading-none uppercase">
                  {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`}
                </span>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-1">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="opacity-90">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-base-200 rounded-lg p-4">
              <ul className="menu menu-compact">
                <li>
                  <Link href="/account" className={isActive('/account') ? 'active' : ''}>
                    <User className="w-5 h-5 text-primary" />
                    Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/orders"
                    className={isActive('/account/orders') ? 'active' : ''}
                  >
                    <Package className="w-5 h-5 text-primary" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/wishlist"
                    className={isActive('/account/wishlist') ? 'active' : ''}
                  >
                    <Heart className="w-5 h-5 text-primary" />
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/addresses"
                    className={isActive('/account/addresses') ? 'active' : ''}
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    Addresses
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/settings"
                    className={isActive('/account/settings') ? 'active' : ''}
                  >
                    <Settings className="w-5 h-5 text-primary" />
                    Settings
                  </Link>
                </li>
                <div className="divider my-2"></div>
                <li>
                  <Link href="/login" className="text-secondary">
                    <LogOut className="w-5 h-5" />
                    Logout
                  </Link>
                </li>
              </ul>
            </div>
          </aside>

          {/* Page content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
