import React, { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'ورود و ثبت‌نام',
    template: '%s | کاکا معلم',
  },
  description: 'ورود به حساب کاربری یا ثبت‌نام در فروشگاه اینترنتی کاکا معلم',
  robots: { index: false, follow: false },
}

export default async function AuthLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="loading loading-spinner loading-lg text-primary" />
          </div>
        }
      >
        {children}
      </Suspense>
    </main>
  )
}
