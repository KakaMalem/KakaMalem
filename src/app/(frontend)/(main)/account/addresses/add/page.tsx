import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import AddAddressClient from './page.client'

export default async function AddAddressPage() {
  const { user } = await getMeUser()

  if (!user) {
    redirect('/auth/login?redirect=/account/addresses/add')
  }

  return <AddAddressClient user={user} />
}
