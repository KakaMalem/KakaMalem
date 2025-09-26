import React from 'react'
import Link from 'next/link'
import { CATEGORIES, ACCOUNT_MENU_ITEMS } from './constants'
import Logo from '../Logo'

export default function DesktopNavbar() {
  return (
    <div className="hidden lg:block">
      {/* Simplified Desktop Navbar */}
      <div className="bg-base-100 border-b border-base-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Logo variant="desktop" />

            {/* Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="input w-full pl-4 pr-10 bg-base-200 border-0 focus:ring-2 focus:ring-primary/20 hover:bg-base-300/50 transition-all duration-200"
                />
                <svg
                  className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Account */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm" title="Account">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="dropdown-content z-10 menu p-2 shadow-lg bg-base-100 rounded-lg w-40"
                >
                  {ACCOUNT_MENU_ITEMS.map((item, index) =>
                    item.isDivider ? (
                      <div key={index} className="divider my-0"></div>
                    ) : item.href ? (
                      <li key={index}>
                        <Link
                          href={item.href}
                          className={`text-sm py-2 hover:bg-base-200 rounded-md ${item.isBold ? 'font-medium' : ''}`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>

              {/* Cart */}
              <Link href="/cart" className="btn btn-ghost btn-sm relative" title="Cart">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5M17 18a2 2 0 11-4 0 2 2 0 014 0zM9 18a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-medium">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar - Sticky */}
      <div className="sticky top-0 z-40 bg-base-200/80 backdrop-blur-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center space-x-8 overflow-x-auto scrollbar-hide">
            <Link
              href="/shop"
              className="text-sm text-base-content hover:text-primary transition-colors whitespace-nowrap font-medium"
            >
              All Products
            </Link>
            {CATEGORIES.filter((cat) => cat.value !== 'all').map((category) => (
              <Link
                key={category.value}
                href={`/category/${category.value}`}
                className="text-sm text-base-content/80 hover:text-primary transition-colors whitespace-nowrap"
              >
                {category.label}
              </Link>
            ))}
            <Link
              href="/deals"
              className="text-sm text-warning hover:text-warning-focus transition-colors whitespace-nowrap font-medium"
            >
              🔥 Hot Deals
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
