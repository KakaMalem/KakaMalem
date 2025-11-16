import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import AddressesClient from './page.client'

export default async function AddressesPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/addresses',
  })

  return <AddressesClient user={user} />
}
