import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import AddAddressClient from './page.client'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function AddAddressPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { user } = await getMeUser()
  const params = await searchParams

  if (!user) {
    redirect('/auth/login?redirect=/account/addresses/add')
  }

  return <AddAddressClient user={user} redirectTo={params.redirect} />
}
