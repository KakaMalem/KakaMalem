import React from 'react'
import type { Metadata } from 'next'

// Force dynamic rendering for store pages since they use authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'فروشگاه',
    template: '%s | کاکا معلم',
  },
}

// Store pages render their own navbar and footer at the page level
// This layout only provides the basic wrapper
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
