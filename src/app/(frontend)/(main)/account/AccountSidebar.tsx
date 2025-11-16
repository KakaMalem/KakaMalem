'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Package, Heart, MapPin, Settings, LogOut, Menu, X } from 'lucide-react'

export default function AccountSidebar() {
  const pathname = usePathname() || '/account'
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path: string) => {
    // Exact match for /account to avoid matching sub-routes
    if (path === '/account') {
      return pathname === '/account'
    }
    // For sub-routes, check if pathname starts with the path
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 btn btn-primary btn-circle btn-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Side Panel */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-base-100 z-100 transform transition-transform duration-300 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-bold">Account Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <ul className="menu menu-compact">
            <li>
              <Link
                href="/account"
                className={`${isActive('/account') ? 'active' : ''} gap-3 py-3`}
              >
                <User className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className={`${isActive('/account/orders') ? 'active' : ''} gap-3 py-3`}
              >
                <Package className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Orders</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/wishlist"
                className={`${isActive('/account/wishlist') ? 'active' : ''} gap-3 py-3`}
              >
                <Heart className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Wishlist</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/addresses"
                className={`${isActive('/account/addresses') ? 'active' : ''} gap-3 py-3`}
              >
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Addresses</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/settings"
                className={`${isActive('/account/settings') ? 'active' : ''} gap-3 py-3`}
              >
                <Settings className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Settings</span>
              </Link>
            </li>
            <div className="divider my-2"></div>
            <li className="text-error">
              <Link href="/auth/logout" className="gap-3 py-3">
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="bg-base-200 rounded-lg p-4">
          <ul className="menu menu-compact">
            <li>
              <Link
                href="/account"
                className={`${isActive('/account') ? 'active' : ''} gap-3 py-2`}
              >
                <User className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/orders"
                className={`${isActive('/account/orders') ? 'active' : ''} gap-3 py-2`}
              >
                <Package className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Orders</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/wishlist"
                className={`${isActive('/account/wishlist') ? 'active' : ''} gap-3 py-2`}
              >
                <Heart className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Wishlist</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/addresses"
                className={`${isActive('/account/addresses') ? 'active' : ''} gap-3 py-2`}
              >
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Addresses</span>
              </Link>
            </li>
            <li>
              <Link
                href="/account/settings"
                className={`${isActive('/account/settings') ? 'active' : ''} gap-3 py-2`}
              >
                <Settings className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Settings</span>
              </Link>
            </li>
            <div className="divider my-2"></div>
            <li className="text-error">
              <Link href="/auth/logout" className="gap-3 py-2">
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Logout</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </>
  )
}
