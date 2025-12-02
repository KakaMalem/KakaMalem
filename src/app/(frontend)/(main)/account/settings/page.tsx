import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import SettingsClient from './page.client'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/settings',
  })

  return <SettingsClient user={user} />
}
