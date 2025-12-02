import React, { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تأیید هویت -  کاکا معلم',
  description: 'صفحات تأیید هویت و ورود به سیستم کاکا معلم',
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
