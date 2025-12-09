'use client'

import React from 'react'
import Link from 'next/link'
import { Home } from 'lucide-react'

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
  const allItems: BreadcrumbItem[] = showHome ? [{ label: 'Home', href: '/' }, ...items] : items

  const truncateLabel = (label: string, maxLength: number = 30) => {
    if (label.length > maxLength) {
      return label.slice(0, maxLength) + '...'
    }
    return label
  }

  return (
    <div className="breadcrumbs text-sm overflow-x-auto">
      <ul>
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isHome = showHome && index === 0

          return (
            <li key={index}>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors inline-flex items-center gap-2 max-w-[200px]"
                  title={item.label}
                >
                  {isHome && <Home className="w-4 h-4 flex-shrink-0" />}
                  <span className="truncate">{truncateLabel(item.label)}</span>
                </Link>
              ) : (
                <span
                  className={`inline-flex items-center gap-2 max-w-[200px] ${isLast ? 'text-base-content font-medium' : ''}`}
                  title={item.label}
                >
                  {isHome && <Home className="w-4 h-4 flex-shrink-0" />}
                  <span className="truncate">{truncateLabel(item.label)}</span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
