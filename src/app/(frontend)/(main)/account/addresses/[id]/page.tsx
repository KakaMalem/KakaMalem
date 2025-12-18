import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import EditAddressClient from './page.client'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function EditAddressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ redirect?: string }>
}) {
  const { id } = await params
  const { redirect: redirectTo } = await searchParams
  const { user } = await getMeUser()

  if (!user) {
    redirect('/auth/login?redirect=/account/addresses')
  }

  const address = user.addresses?.find((addr) => addr.id === id)

  if (!address) {
    redirect('/account/addresses')
  }

  return <EditAddressClient user={user} address={address} redirectTo={redirectTo} />
}
