import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'
import RegisterPageClient from './page.client'

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic'

async function checkAuthentication(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('kakamalem-token')?.value

    if (!token) {
      return false
    }

    const baseUrl = getServerSideURL()
    const response = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `JWT ${token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return !!(data && data.user)
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

export default async function RegisterPage() {
  // Check if user is already logged in
  const isAuthenticated = await checkAuthentication()

  if (isAuthenticated) {
    // Redirect to home page if already logged in
    redirect('/')
  }

  return <RegisterPageClient />
}
