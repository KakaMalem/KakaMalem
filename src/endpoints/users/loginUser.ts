import type { Endpoint } from 'payload'
import { getGeoLocationFromRequest, updateUserLocation } from '@/utilities/geolocation'

interface LoginRequest {
  email: string
  password: string
  stayLoggedIn?: boolean
}

export const loginUser: Endpoint = {
  path: '/login',
  method: 'post',
  handler: async (req) => {
    const { payload } = req

    // Parse request body
    let body: LoginRequest
    try {
      body = (await req.json?.()) || req.body
    } catch (_e) {
      return Response.json({ error: 'فرمت درخواست نامعتبر است' }, { status: 400 })
    }

    const { email, password, stayLoggedIn = false } = body

    // Validate required fields
    if (!email || !password) {
      return Response.json({ error: 'ایمیل و رمز عبور الزامی است' }, { status: 400 })
    }

    try {
      // First check if user exists (for more specific error messages)
      const existingUsers = await payload.find({
        collection: 'users',
        where: { email: { equals: email.toLowerCase().trim() } },
        limit: 1,
      })

      if (existingUsers.docs.length === 0) {
        return Response.json({ error: 'کاربری با این ایمیل یافت نشد' }, { status: 404 })
      }

      const existingUser = existingUsers.docs[0]
      const authMethods = (existingUser.authMethods as string[]) || []
      const hasPasswordAuth = authMethods.includes('password')
      const hasGoogleAuth = authMethods.includes('google')

      // Check if user has password authentication enabled
      if (!hasPasswordAuth) {
        // User registered with OAuth only
        if (hasGoogleAuth) {
          return Response.json(
            {
              error:
                'این حساب با گوگل ثبت شده است. لطفاً با گوگل وارد شوید یا یک رمز عبور تنظیم کنید.',
              code: 'OAUTH_ONLY',
              authMethods: authMethods,
            },
            { status: 400 },
          )
        }
        // Edge case: user has no auth methods (shouldn't happen)
        return Response.json(
          { error: 'خطا در احراز هویت. لطفاً با پشتیبانی تماس بگیرید.' },
          { status: 500 },
        )
      }

      // Check if email is verified (only for password-based users)
      if (!existingUser._verified) {
        return Response.json(
          {
            error: 'لطفاً ابتدا ایمیل خود را تأیید کنید',
            requiresVerification: true,
            email: existingUser.email,
          },
          { status: 403 },
        )
      }

      // User exists and has password auth, try to login
      const result = await payload.login({
        collection: 'users',
        data: { email, password },
        req,
      })

      // Capture user location from IP (non-blocking)
      // Only update location if user hasn't granted browser permission before
      // (browser GPS is more accurate than IP geolocation)
      const existingLocation = existingUser.location as { permissionGranted?: boolean } | undefined
      if (!existingLocation?.permissionGranted) {
        getGeoLocationFromRequest(req, 'login')
          .then((location) => updateUserLocation(payload, result.user.id, location))
          .catch((err) => console.error('Failed to capture location on login:', err))
      }

      // Migrate any guest orders with matching email to this user account
      try {
        const guestOrders = await payload.find({
          collection: 'orders',
          where: {
            guestEmail: {
              equals: email.toLowerCase().trim(),
            },
          },
          limit: 100,
        })

        if (guestOrders.docs.length > 0) {
          console.log(`Found ${guestOrders.docs.length} guest orders to link for ${email} on login`)

          // Update each guest order to link to the user
          await Promise.all(
            guestOrders.docs.map((order) =>
              payload.update({
                collection: 'orders',
                id: order.id,
                data: {
                  customer: result.user.id,
                  guestEmail: undefined, // Clear guest email
                },
              }),
            ),
          )

          console.log(
            `Successfully linked ${guestOrders.docs.length} guest orders to user ${result.user.id}`,
          )
        }
      } catch (migrationError) {
        // Log error but don't fail login
        console.error('Error migrating guest orders on login:', migrationError)
      }

      // Calculate cookie expiration based on "remember me"
      const cookieExpiration = stayLoggedIn
        ? 60 * 60 * 24 * 7 // 7 days if "remember me" is checked
        : 60 * 60 * 24 // 24 hours if not checked

      // Set the cookie with appropriate expiration
      // Only require secure cookies in production AND when not on local network
      const isLocalNetwork =
        req.headers.get('host')?.includes('192.168.') ||
        req.headers.get('host')?.includes('localhost')
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && !isLocalNetwork,
        sameSite: 'lax' as const,
        maxAge: cookieExpiration,
        path: '/',
      }

      // Create response with updated cookie
      const response = Response.json(
        {
          message: 'ورود با موفقیت انجام شد',
          user: result.user,
          token: result.token,
          exp: result.exp,
        },
        { status: 200 },
      )

      // Set the auth cookie with the token
      const cookieName = `${payload.config.cookiePrefix || 'payload'}-token`
      const cookieValue = `${cookieName}=${result.token}; HttpOnly; ${cookieOptions.secure ? 'Secure; ' : ''}SameSite=${cookieOptions.sameSite}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}`

      response.headers.set('Set-Cookie', cookieValue)

      return response
    } catch (error: unknown) {
      console.error('Login error:', error)

      // Handle authentication errors
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message.toLowerCase()

        // Since we already checked user exists, this means password is wrong
        if (errorMessage.includes('incorrect') || errorMessage.includes('credentials')) {
          return Response.json({ error: 'رمز عبور اشتباه است' }, { status: 401 })
        }

        // Check for locked account
        if (errorMessage.includes('locked')) {
          return Response.json(
            { error: 'حساب کاربری قفل شده است. لطفاً با پشتیبانی تماس بگیرید.' },
            { status: 403 },
          )
        }

        // Handle unverified email error from Payload's internal check
        if (errorMessage.includes('verify') || errorMessage.includes('unverified')) {
          return Response.json(
            {
              error: 'لطفاً ابتدا ایمیل خود را تأیید کنید',
              requiresVerification: true,
              email: email,
            },
            { status: 403 },
          )
        }
      }

      return Response.json({ error: 'ورود ناموفق بود. لطفاً دوباره امتحان کنید.' }, { status: 500 })
    }
  },
}
