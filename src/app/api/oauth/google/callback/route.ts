import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import mongoose from 'mongoose'
import { getGeoLocationFromRequest, updateUserLocation } from '@/utilities/geolocation'

/**
 * Google OAuth callback handler
 * Handles both new user creation and existing user login
 *
 * Auth flow:
 * 1. Exchange authorization code for access token
 * 2. Get user info from Google
 * 3. Create or update user with Google auth method
 * 4. Generate session using Payload's internal login
 * 5. Redirect to success page with auth cookie
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') || '/'

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/login?error=no_code', process.env.NEXT_PUBLIC_SERVER_URL),
      )
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
      return NextResponse.redirect(
        new URL('/auth/login?error=token_exchange_failed', process.env.NEXT_PUBLIC_SERVER_URL),
      )
    }

    const { access_token } = await tokenResponse.json()

    // Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userInfoResponse.ok) {
      console.error('OAuth: Failed to get user info:', await userInfoResponse.text())
      return NextResponse.redirect(
        new URL('/auth/login?error=userinfo_failed', process.env.NEXT_PUBLIC_SERVER_URL),
      )
    }

    const googleUser = await userInfoResponse.json()
    const payload = await getPayload({ config })

    // @ts-expect-error - accessing internal MongoDB connection
    const db = payload.db?.connection?.db || payload.db?.client?.db()
    if (!db) {
      throw new Error('OAuth: Could not access database')
    }

    // Check if user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: { email: { equals: googleUser.email } },
      limit: 1,
    })

    let userId: string
    let isNewUser = false
    let userName = ''
    let originalHash: string | null = null
    let originalSalt: string | null = null

    // Generate a random password for OAuth login
    const oauthPassword = crypto.randomUUID() + crypto.randomUUID()

    if (existingUsers.docs.length > 0) {
      // Existing user - add Google to auth methods if not already present
      const user = existingUsers.docs[0]
      userId = user.id
      userName = user.firstName || googleUser.given_name || ''

      const currentAuthMethods = (user.authMethods as string[]) || []
      const hasGoogleAuth = currentAuthMethods.includes('google')
      const hasPasswordAuth = currentAuthMethods.includes('password')

      const updateFields: Record<string, unknown> = {
        googleSub: googleUser.sub,
        picture: googleUser.picture,
        _verified: true, // Auto-verify via OAuth
      }

      // Add Google to auth methods if not present
      if (!hasGoogleAuth) {
        updateFields.authMethods = [...currentAuthMethods, 'google']
      }

      // Update the non-password fields
      await db
        .collection('users')
        .updateOne({ _id: new mongoose.Types.ObjectId(userId) }, { $set: updateFields })

      // For users with password auth, we need to save and restore their password hash
      if (hasPasswordAuth) {
        // Get the current password hash from MongoDB
        const userDoc = await db
          .collection('users')
          .findOne({ _id: new mongoose.Types.ObjectId(userId) })

        originalHash = userDoc?.hash || null
        originalSalt = userDoc?.salt || null
      }

      // Update password (this hashes it properly via Payload)
      await payload.update({
        collection: 'users',
        id: userId,
        data: { password: oauthPassword },
      })
    } else {
      // New user - create with Google auth method
      isNewUser = true
      userName = googleUser.given_name || googleUser.name?.split(' ')[0] || ''

      // Create user with Payload (this handles password hashing)
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
          lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
          roles: ['customer'],
          password: oauthPassword,
        },
      })

      userId = newUser.id

      // Update the system-managed fields directly in MongoDB
      await db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        {
          $set: {
            googleSub: googleUser.sub,
            picture: googleUser.picture,
            authMethods: ['google'],
            _verified: true,
          },
        },
      )
    }

    // Login the user using Payload's internal mechanism
    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: googleUser.email,
        password: oauthPassword,
      },
    })

    // Restore original password hash if user had password auth
    if (originalHash && originalSalt) {
      await db
        .collection('users')
        .updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $set: { hash: originalHash, salt: originalSalt } },
        )
    }

    // Capture user location from IP (non-blocking)
    // Only update if user hasn't granted browser permission (browser GPS is more accurate)
    const existingUser = existingUsers.docs[0]
    const existingLocation = existingUser?.location as { permissionGranted?: boolean } | undefined
    if (!existingLocation?.permissionGranted) {
      getGeoLocationFromRequest(request, 'oauth')
        .then((location) => updateUserLocation(payload, userId, location))
        .catch((err) => console.error('Failed to capture location on OAuth:', err))
    }

    // Build success page URL
    const authType = isNewUser ? 'register' : 'login'
    const successUrl = new URL('/auth/success', process.env.NEXT_PUBLIC_SERVER_URL)
    successUrl.searchParams.set('type', authType)
    successUrl.searchParams.set('name', userName)
    successUrl.searchParams.set('redirect', state)

    // Create redirect response
    const response = NextResponse.redirect(successUrl)

    // Set the auth cookie
    const cookieName = `${payload.config.cookiePrefix || 'payload'}-token`
    const cookieValue = `${cookieName}=${loginResult.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`
    response.headers.set('Set-Cookie', cookieValue)

    // Set flag for cart merge
    response.headers.append('Set-Cookie', 'justLoggedIn=true; Path=/; Max-Age=60')

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=callback_failed', process.env.NEXT_PUBLIC_SERVER_URL),
    )
  }
}
