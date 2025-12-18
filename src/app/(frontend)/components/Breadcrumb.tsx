'use client'

import React from 'react'
import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, showHome = true }) => {
  const allItems: BreadcrumbItem[] = showHome ? [{ label: 'خانه', href: '/' }, ...items] : items

  const truncateLabel = (label: string, maxLength: number = 30) => {
    if (label.length > maxLength) {
      return label.slice(0, maxLength) + '...'
    }
    return label
  }

  return (
    <nav aria-label="Breadcrumb" dir="rtl" className="py-2">
      <ol className="flex items-center flex-wrap gap-2 text-sm">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isHome = showHome && index === 0

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 text-base-content/60 hover:text-primary transition-colors group"
                  title={item.label}
                >
                  {isHome && <Home className="w-4 h-4 flex-shrink-0" />}
                  <span className="max-w-[150px] md:max-w-[200px] truncate">
                    {truncateLabel(item.label)}
                  </span>
                </Link>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    isLast ? 'text-base-content font-medium' : 'text-base-content/60'
                  }`}
                  title={item.label}
                >
                  {isHome && <Home className="w-4 h-4 flex-shrink-0" />}
                  <span className="max-w-[150px] md:max-w-[200px] truncate">
                    {truncateLabel(item.label)}
                  </span>
                </span>
              )}
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-base-content/40 flex-shrink-0 rotate-180" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
