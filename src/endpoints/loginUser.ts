import type { Endpoint } from 'payload'

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
    } catch (e) {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { email, password, stayLoggedIn = false } = body

    // Validate required fields
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }

    try {
      // Use Payload's built-in login
      const result = await payload.login({
        collection: 'users',
        data: { email, password },
        req,
      })

      // Calculate cookie expiration based on "remember me"
      const cookieExpiration = stayLoggedIn
        ? 60 * 60 * 24 * 7 // 7 days if "remember me" is checked
        : 60 * 60 * 24 // 24 hours if not checked

      // Set the cookie with appropriate expiration
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: cookieExpiration,
        path: '/',
      }

      // Create response with updated cookie
      const response = Response.json(
        {
          message: 'Login successful',
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
        const errorMessage = (error as any).message

        if (errorMessage.includes('credentials')) {
          return Response.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        if (errorMessage.includes('locked')) {
          return Response.json(
            { error: 'Account is locked. Please contact support.' },
            { status: 403 },
          )
        }
      }

      return Response.json({ error: 'Login failed. Please try again.' }, { status: 500 })
    }
  },
}
