'use client'

import React, { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '@/providers'
import DesktopCartSidebar from '../DesktopCartSidebar'

export default function CartButton() {
  const { cart } = useCart()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const hasItems = itemCount > 0

  return (
    <>
      <button
        className="btn btn-ghost btn-circle btn-sm hover:bg-base-200 relative"
        title="سبد خرید"
        onClick={() => setIsSidebarOpen(true)}
        aria-label={`سبد خرید با ${itemCount} مورد`}
      >
        <div className="indicator">
          <ShoppingBag className="w-5 h-5" />
          {hasItems && (
            <span className="indicator-item badge badge-primary badge-xs text-primary-content font-bold animate-pulse">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </div>
      </button>

      {/* Cart Sidebar - Works on all devices */}
      <DesktopCartSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  )
}
