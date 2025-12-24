import type { Endpoint } from 'payload'
import { getGeoLocationFromRequest, updateUserLocation } from '@/utilities/geolocation'

/**
 * Custom email verification endpoint with auto-login
 * - Verifies user email using the token
 * - Automatically logs the user in after verification
 * - Returns auth token and user data
 */
export const verifyEmail: Endpoint = {
  path: '/verify-email',
  method: 'post',
  handler: async (req) => {
    const { payload } = req

    // Parse request body
    let body: { token?: string }
    try {
      body = (await req.json?.()) || req.body || {}
    } catch (_e) {
      body = {}
    }

    const { token } = body

    if (!token) {
      return Response.json({ error: 'توکن تأیید الزامی است' }, { status: 400 })
    }

    try {
      // Find user by verification token
      const users = await payload.find({
        collection: 'users',
        where: {
          _verificationToken: { equals: token },
        },
        limit: 1,
        showHiddenFields: true,
      })

      if (users.docs.length === 0) {
        return Response.json({ error: 'توکن تأیید نامعتبر یا منقضی شده است' }, { status: 400 })
      }

      const user = users.docs[0]

      // Check if already verified
      if (user._verified) {
        return Response.json(
          {
            message: 'ایمیل شما قبلاً تأیید شده است',
            alreadyVerified: true,
          },
          { status: 200 },
        )
      }

      // Verify the user using Payload's built-in method
      await payload.verifyEmail({
        collection: 'users',
        token,
      })

      // Generate a temporary password for login
      const tempPassword = crypto.randomUUID() + crypto.randomUUID()

      // Get access to MongoDB to save and restore the password hash
      // @ts-expect-error - accessing internal MongoDB connection
      const db = payload.db?.connection?.db || payload.db?.client?.db()

      let originalHash: string | null = null
      let originalSalt: string | null = null

      if (db) {
        const mongoose = await import('mongoose')

        // Get the current password hash
        const userDoc = await db
          .collection('users')
          .findOne({ _id: new mongoose.Types.ObjectId(user.id) })

        originalHash = userDoc?.hash || null
        originalSalt = userDoc?.salt || null

        // Set temporary password for login
        await payload.update({
          collection: 'users',
          id: user.id,
          data: { password: tempPassword },
        })

        // Login the user
        const loginResult = await payload.login({
          collection: 'users',
          data: {
            email: user.email,
            password: tempPassword,
          },
        })

        // Restore original password hash
        if (originalHash && originalSalt) {
          await db
            .collection('users')
            .updateOne(
              { _id: new mongoose.Types.ObjectId(user.id) },
              { $set: { hash: originalHash, salt: originalSalt } },
            )
        }

        // Capture user location from IP (non-blocking)
        getGeoLocationFromRequest(req, 'verify_email')
          .then((location) => updateUserLocation(payload, user.id, location))
          .catch((err) => console.error('Failed to capture location on email verification:', err))

        // Build cookie
        const cookieName = `${payload.config.cookiePrefix || 'payload'}-token`
        const cookieExpiration = 60 * 60 * 24 // 24 hours
        const isLocalNetwork =
          req.headers.get('host')?.includes('192.168.') ||
          req.headers.get('host')?.includes('localhost')
        const isSecure = process.env.NODE_ENV === 'production' && !isLocalNetwork

        const response = Response.json(
          {
            message: 'ایمیل با موفقیت تأیید شد',
            user: loginResult.user,
            token: loginResult.token,
          },
          { status: 200 },
        )

        // Set auth cookie
        const cookieValue = `${cookieName}=${loginResult.token}; HttpOnly; ${isSecure ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=${cookieExpiration}`
        response.headers.set('Set-Cookie', cookieValue)

        return response
      }

      // Fallback if no DB access (shouldn't happen)
      return Response.json(
        {
          message: 'ایمیل با موفقیت تأیید شد',
          verified: true,
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Verify email error:', error)

      // Check if it's an already verified error from Payload
      if (error instanceof Error && error.message?.includes('already verified')) {
        return Response.json(
          {
            message: 'ایمیل شما قبلاً تأیید شده است',
            alreadyVerified: true,
          },
          { status: 200 },
        )
      }

      return Response.json(
        { error: 'خطا در تأیید ایمیل. لطفاً دوباره امتحان کنید.' },
        { status: 500 },
      )
    }
  },
}
