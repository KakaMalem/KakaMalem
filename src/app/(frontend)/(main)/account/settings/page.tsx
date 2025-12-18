import React from 'react'
import type { Metadata } from 'next'
import { getMeUser } from '@/utilities/getMeUser'
import SettingsClient from './page.client'

export const metadata: Metadata = {
  title: 'تنظیمات حساب',
  description: 'تنظیمات و ویرایش اطلاعات حساب کاربری در فروشگاه کاکا معلم',
  robots: { index: false, follow: false },
}

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/settings',
  })

  return <SettingsClient user={user} />
}
