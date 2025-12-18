import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'تکمیل خرید',
    template: '%s | کاکا معلم',
  },
  description: 'تکمیل فرایند خرید و پرداخت در فروشگاه کاکا معلم',
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
