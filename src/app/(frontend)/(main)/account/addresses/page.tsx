import React from 'react'
import type { Metadata } from 'next'
import { getMeUser } from '@/utilities/getMeUser'
import AddressesClient from './page.client'

export const metadata: Metadata = {
  title: 'آدرس‌های من',
  description: 'مدیریت آدرس‌های تحویل در فروشگاه کاکا معلم',
  robots: { index: false, follow: false },
}

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/addresses',
  })

  const params = await searchParams

  return <AddressesClient user={user} redirectTo={params.redirect} />
}
