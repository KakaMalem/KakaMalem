import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') || '/' // Get redirect URL from OAuth state

    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/oauth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/auth/login?error=token_exchange_failed', request.url))
    }

    const { access_token } = await tokenResponse.json()

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', await userInfoResponse.text())
      return NextResponse.redirect(new URL('/auth/login?error=userinfo_failed', request.url))
    }

    const googleUser = await userInfoResponse.json()
    const payload = await getPayload({ config })

    // Find or create user
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: googleUser.email,
        },
      },
      limit: 1,
    })

    let user
    const tempPassword = crypto.randomBytes(24).toString('hex')

    if (existingUsers.docs.length > 0) {
      user = existingUsers.docs[0]

      // Update user with OAuth info
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          password: tempPassword,
          sub: googleUser.sub,
          picture: googleUser.picture,
        },
      })
    } else {
      // Create new user
      user = await payload.create({
        collection: 'users',
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
          lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
          sub: googleUser.sub,
          picture: googleUser.picture,
          roles: ['customer'],
          password: tempPassword,
        },
      })
    }

    // Generate JWT token using the temp password

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: googleUser.email,
        password: tempPassword,
      },
    })

    // Create response with redirect to the preserved URL from state
    const response = NextResponse.redirect(new URL(state, request.url))

    // Set the Payload token cookie using the token from Payload's login
    const cookieName = `${payload.config.cookiePrefix || 'payload'}-token`

    if (loginResult.token) {
      response.cookies.set(cookieName, loginResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    response.cookies.set('justLoggedIn', 'true', {
      httpOnly: false,
      path: '/',
      maxAge: 60,
    })

    return response
  } catch (error) {
    console.error('❌ OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url))
  }
}
