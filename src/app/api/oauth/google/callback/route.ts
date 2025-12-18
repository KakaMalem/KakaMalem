import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import mongoose from 'mongoose'

/**
 * Google OAuth callback handler
 * Handles both new user creation and existing user login
 *
 * For users with hasPassword=true (email/password users):
 * - Temporarily sets a known password to generate a valid session
 * - Restores the original password hash after login
 * - This preserves their ability to login with email/password
 *
 * For users with hasPassword=false (OAuth-only users):
 * - Sets a random password and uses login endpoint directly
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') || '/'

    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
    }

    // Exchange authorization code for access token
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
      console.error('OAuth: Failed to exchange code for token:', await tokenResponse.text())
      return NextResponse.redirect(new URL('/auth/login?error=token_exchange_failed', request.url))
    }

    const { access_token } = await tokenResponse.json()

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userInfoResponse.ok) {
      console.error('OAuth: Failed to get user info:', await userInfoResponse.text())
      return NextResponse.redirect(new URL('/auth/login?error=userinfo_failed', request.url))
    }

    const googleUser = await userInfoResponse.json()
    const payload = await getPayload({ config })

    // Check if user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: googleUser.email } },
      limit: 1,
    })

    let oauthPassword: string
    let existingUser: User | null = null
    let canUseLoginEndpoint = false
    let isNewUser = false
    let userName = ''

    if (existingUsers.docs.length > 0) {
      // Existing user - update OAuth info
      const user = existingUsers.docs[0]
      const isOAuthUser = !user.hasPassword

      oauthPassword = crypto.randomUUID() + crypto.randomUUID()

      const updateData: Record<string, string | undefined> = {
        sub: googleUser.sub,
        picture: googleUser.picture,
      }

      // Only update password for OAuth-only users (safe - they don't use password login)
      // Email/password users keep their password intact
      if (isOAuthUser) {
        updateData.password = oauthPassword
        canUseLoginEndpoint = true
      }

      existingUser = await payload.update({
        collection: 'users',
        id: user.id,
        data: updateData,
      })
      userName = existingUser.firstName || googleUser.given_name || ''
    } else {
      // New user - create with random password
      oauthPassword = crypto.randomUUID() + crypto.randomUUID()
      canUseLoginEndpoint = true
      isNewUser = true
      userName = googleUser.given_name || googleUser.name?.split(' ')[0] || ''

      await payload.create({
        collection: 'users',
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
          lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
          sub: googleUser.sub,
          picture: googleUser.picture,
          roles: ['customer'],
          password: oauthPassword,
        },
      })
    }

    let setCookieHeader: string | null = null

    if (canUseLoginEndpoint) {
      // OAuth-only users or new users: Use login endpoint directly
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleUser.email,
          password: oauthPassword,
          stayLoggedIn: true,
        }),
      })

      if (!loginResponse.ok) {
        console.error('OAuth: Login endpoint failed:', await loginResponse.text())
        return NextResponse.redirect(new URL('/auth/login?error=login_failed', request.url))
      }

      setCookieHeader = loginResponse.headers.get('set-cookie')
    } else {
      // Email/password users: Temporarily set password, login, then restore original hash
      if (!existingUser) {
        throw new Error('OAuth: User not found')
      }

      // Get the current password hash directly from MongoDB
      // @ts-expect-error - accessing internal MongoDB connection
      const db = payload.db?.connection?.db || payload.db?.client?.db()
      if (!db) {
        throw new Error('OAuth: Could not access database')
      }

      const userDoc = await db
        .collection('users')
        .findOne({ _id: new mongoose.Types.ObjectId(existingUser.id) })

      // Store original auth data
      const originalHash = userDoc?.hash
      const originalSalt = userDoc?.salt

      if (!originalHash || !originalSalt) {
        throw new Error('OAuth: User has no password hash')
      }

      // Set a temporary known password
      const tempPassword = crypto.randomUUID() + crypto.randomUUID()

      // Update password temporarily (this will hash it properly)
      await payload.update({
        collection: 'users',
        id: existingUser.id,
        data: { password: tempPassword },
      })

      // Login with the temp password
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: existingUser.email,
          password: tempPassword,
          stayLoggedIn: true,
        }),
      })

      if (!loginResponse.ok) {
        console.error('OAuth: Login with temp password failed:', await loginResponse.text())
        // Try to restore original password before returning error
        try {
          await db
            .collection('users')
            .updateOne(
              { _id: new mongoose.Types.ObjectId(existingUser.id) },
              { $set: { hash: originalHash, salt: originalSalt } },
            )
        } catch (_) {
          // Ignore restoration error
        }
        return NextResponse.redirect(new URL('/auth/login?error=login_failed', request.url))
      }

      setCookieHeader = loginResponse.headers.get('set-cookie')

      // Restore the original password hash directly in MongoDB
      try {
        await db
          .collection('users')
          .updateOne(
            { _id: new mongoose.Types.ObjectId(existingUser.id) },
            { $set: { hash: originalHash, salt: originalSalt } },
          )
      } catch (restoreErr) {
        console.error('OAuth: Failed to restore original password:', restoreErr)
        // Continue anyway - user is logged in, they can reset password if needed
      }
    }

    // Build success page URL with parameters
    const authType = isNewUser ? 'register' : 'login'
    const successUrl = new URL('/auth/success', request.url)
    successUrl.searchParams.set('type', authType)
    successUrl.searchParams.set('name', userName)
    successUrl.searchParams.set('redirect', state)

    // Create redirect response to success page
    const response = NextResponse.redirect(successUrl)

    if (setCookieHeader) {
      response.headers.set('Set-Cookie', setCookieHeader)
    }

    // Set flag for cart merge after login
    response.headers.append('Set-Cookie', 'justLoggedIn=true; Path=/; Max-Age=60')

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url))
  }
}
