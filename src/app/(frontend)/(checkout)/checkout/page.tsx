import { getMeUser } from '@/utilities/getMeUser'
import CheckoutClient from './page.client'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const { user } = await getMeUser({
    nullUserRedirect: undefined, // Allow guest checkout
  })

  return <CheckoutClient user={user || null} />
}
