import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import AddressesClient from './page.client'

interface AddressesPageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function AddressesPage({ searchParams }: AddressesPageProps) {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account/addresses',
  })

  const { redirect } = await Promise.resolve(searchParams)

  return <AddressesClient user={user} redirectUrl={redirect} />
}
