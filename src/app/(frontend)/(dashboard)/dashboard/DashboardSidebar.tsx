'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronLeft,
  FolderTree,
  Store,
} from 'lucide-react'
import type { User as PayloadUser } from '@/payload-types'

interface DashboardSidebarProps {
  user: PayloadUser
}

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number | string
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname() || '/dashboard'
  const [isOpen, setIsOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === path || pathname?.startsWith(path + '/')
  }

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Main navigation items
  const menuItems: MenuItem[] = [
    {
      href: '/dashboard',
      label: 'خلاصه',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      href: '/dashboard/products',
      label: 'محصولات',
      icon: <Package className="w-5 h-5" />,
    },
    {
      href: '/dashboard/categories',
      label: 'دسته‌بندی‌ها',
      icon: <FolderTree className="w-5 h-5" />,
    },
    {
      href: '/dashboard/orders',
      label: 'سفارشات',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      href: '/dashboard/analytics',
      label: 'آمار و تحلیل',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      href: '/dashboard/settings',
      label: 'تنظیمات',
      icon: <Settings className="w-5 h-5" />,
    },
  ]

  // Render menu item for mobile
  const renderMobileMenuItem = (item: MenuItem) => {
    const active = isActive(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 ${
          active
            ? 'bg-primary text-primary-content shadow-md'
            : 'hover:bg-base-200 active:bg-base-300'
        }`}
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            active ? 'bg-primary-content/20' : 'bg-base-200'
          }`}
        >
          <span className={active ? 'text-primary-content' : 'text-primary'}>{item.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className={`font-medium ${active ? '' : 'text-base-content'}`}>{item.label}</span>
        </div>
        {item.badge !== undefined && (typeof item.badge !== 'number' || item.badge > 0) && (
          <span
            className={`badge badge-sm ${active ? 'bg-primary-content/20 text-primary-content border-0' : 'badge-primary'}`}
          >
            {item.badge}
          </span>
        )}
        <ChevronLeft
          className={`w-5 h-5 ${active ? 'text-primary-content/70' : 'text-base-content/40'}`}
        />
      </Link>
    )
  }

  // Render menu item for desktop
  const renderDesktopMenuItem = (item: MenuItem) => {
    const active = isActive(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 ${
          active
            ? 'bg-primary text-primary-content font-medium'
            : 'hover:bg-base-300 text-base-content'
        } focus:outline-none focus:ring-2 focus:ring-primary/50`}
      >
        <span className={active ? 'text-primary-content' : 'text-primary'}>{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && (typeof item.badge !== 'number' || item.badge > 0) && (
          <span
            className={`badge badge-xs ${active ? 'bg-primary-content/20 text-primary-content border-0' : 'badge-primary'}`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 btn btn-primary btn-circle btn-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/30"
        aria-label="باز کردن منو"
        aria-expanded={isOpen}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Side Panel */}
      <aside
        className={`lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-base-100 z-[80] transform transition-transform duration-300 ease-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="منوی داشبورد"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-content">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium opacity-80">داشبورد فروشنده</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary-content/20 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">مدیریت فروشگاه</h2>
              <p className="text-sm opacity-80 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="flex flex-col gap-2">{menuItems.map(renderMobileMenuItem)}</nav>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 flex-shrink-0">
        <div className="bg-base-200 rounded-xl p-4 sticky top-24 shadow-sm border border-base-300">
          <nav className="flex flex-col gap-1">{menuItems.map(renderDesktopMenuItem)}</nav>
        </div>
      </aside>
    </>
  )
}
