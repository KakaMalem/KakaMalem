import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'تأیید هویت -  کاکا معلم',
  description: 'صفحات تأیید هویت و ورود به سیستم کاکا معلم',
}

export default async function AuthLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return <main>{children}</main>
}
