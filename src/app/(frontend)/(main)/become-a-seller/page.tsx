import React from 'react'
import type { Metadata } from 'next'
import { getMeUser } from '@/utilities/getMeUser'
import { redirect } from 'next/navigation'
import BecomeSellerClient from './page.client'

export const metadata: Metadata = {
  title: 'فروشنده شوید | کاکا معلم',
  description:
    'فروشگاه آنلاین خود را در کاکا معلم راه‌اندازی کنید و محصولات خود را به هزاران مشتری بفروشید.',
}

export default async function BecomeSellerPage() {
  const { user } = await getMeUser()

  // If user is already a seller or has a storefront, redirect to dashboard
  if (user?.roles?.includes('seller') || user?.roles?.includes('storefront_owner')) {
    redirect('/dashboard')
  }

  return <BecomeSellerClient user={user} />
}
