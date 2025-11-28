import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/oauth/google/callback`

  // Get redirect URL from query params to preserve it through OAuth flow
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get('redirect') || '/'

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: redirectTo, // Use OAuth state parameter to preserve redirect URL
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return NextResponse.redirect(authUrl)
}
