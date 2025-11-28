'use server'

import { redirect } from 'next/navigation'

export async function signInWithGoogle(redirectTo?: string) {
  // Redirect to custom Google OAuth endpoint with redirect parameter preserved
  const redirectParam = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''
  redirect(`/api/oauth/google${redirectParam}`)
}
