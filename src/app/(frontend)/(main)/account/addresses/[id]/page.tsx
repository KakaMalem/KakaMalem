import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import EditAddressClient from './page.client'

export default async function EditAddressPage({ params }: { params: { id: string } }) {
  const { user } = await getMeUser()

  if (!user) {
    redirect('/auth/login?redirect=/account/addresses')
  }

  const address = user.addresses?.find((addr) => addr.id === params.id)

  if (!address) {
    redirect('/account/addresses')
  }

  return <EditAddressClient user={user} address={address} />
}
