import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import AddressesClient from './page.client'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function AddressesPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/addresses',
  })

  return <AddressesClient user={user} />
}
