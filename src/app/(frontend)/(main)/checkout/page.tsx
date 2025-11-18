import { getMeUser } from '@/utilities/getMeUser'
import CheckoutClient from './page.client'

export default async function CheckoutPage() {
  const { user } = await getMeUser({
    nullUserRedirect: undefined, // Allow guest checkout
  })

  return <CheckoutClient user={user || null} />
}
