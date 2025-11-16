import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import SettingsClient from './page.client'

export default async function SettingsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/settings',
  })

  return <SettingsClient user={user} />
}
