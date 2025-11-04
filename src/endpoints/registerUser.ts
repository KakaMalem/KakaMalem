import type { Endpoint } from 'payload'

interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export const registerUser: Endpoint = {
  path: '/register',
  method: 'post',
  handler: async (req) => {
    const { payload } = req

    // Parse request body with proper error handling
    let body: RegisterRequest
    try {
      body = (await req.json?.()) || req.body
    } catch (e) {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { email, password, firstName, lastName, phone } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return Response.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      )
    }

    try {
      // Check for existing user
      const existingUsers = await payload.find({
        collection: 'users',
        where: { email: { equals: email.toLowerCase().trim() } },
        limit: 1,
      })

      if (existingUsers.docs.length > 0) {
        return Response.json({ error: 'Email already registered' }, { status: 409 })
      }

      // Create user
      let user
      try {
        user = await payload.create({
          collection: 'users',
          data: {
            email: email.toLowerCase().trim(),
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone?.trim() || undefined,
            roles: ['customer'],
          },
        })

        console.log('User created successfully:', user.id)
      } catch (userError) {
        console.error('User creation error:', userError)
        return Response.json({ error: 'Failed to create user account' }, { status: 500 })
      }

      // Auto-login after registration
      let token = null
      let loginSuccess = false

      try {
        console.log('Attempting auto-login for:', user.email)

        const loginResult = await payload.login({
          collection: 'users',
          data: {
            email: user.email as string,
            password, // Use the raw password from the request
          },
          req,
        })

        token = loginResult.token
        loginSuccess = true

        console.log('Auto-login successful, token generated:', !!token)
      } catch (loginError: any) {
        console.error('Auto-login after registration failed:', loginError)
        console.error('Login error details:', {
          message: loginError.message,
          status: loginError.status,
          data: loginError.data,
        })
        // Continue without token - user can login manually
      }

      // Return response with success flag
      return Response.json(
        {
          success: true,
          message: loginSuccess
            ? 'Registration successful. You are now logged in.'
            : 'Registration successful. Please log in.',
          token, // Will be null if login failed
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            roles: user.roles,
          },
          autoLoginFailed: !loginSuccess, // Flag to help debug
        },
        { status: 201 },
      )
    } catch (error: unknown) {
      console.error('Registration error:', error)

      // Handle specific PayloadCMS validation errors
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'ValidationError') {
          const validationError = error as any
          return Response.json(
            {
              error: 'Validation failed',
              details: validationError.data || validationError.message,
            },
            { status: 400 },
          )
        }

        if (error.name === 'MongoError' || error.name === 'BulkWriteError') {
          const dbError = error as any
          if (dbError.code === 11000) {
            return Response.json({ error: 'Email already exists' }, { status: 409 })
          }
        }
      }

      return Response.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }
  },
}
