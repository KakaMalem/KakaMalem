import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import type { Metadata } from 'next'

// Force dynamic rendering for this layout since Navbar uses authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'کاکا معلم',
    template: '%s | کاکا معلم',
  },
  description: 'فروشگاه اینترنتی کاکا معلم - خرید آنلاین محصولات با کیفیت با ارسال سریع در کابل',
}

export default function MainLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
