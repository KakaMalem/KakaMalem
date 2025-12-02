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
    } catch (_e) {
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
      const user = await payload.create({
        collection: 'users',
        data: {
          email: email.toLowerCase().trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone?.trim() || undefined,
          roles: ['customer'],
          hasPassword: true,
        },
      })

      console.log('User created successfully:', user.id)

      // Migrate guest orders to the new user account
      try {
        const guestOrders = await payload.find({
          collection: 'orders',
          where: {
            guestEmail: {
              equals: email.toLowerCase().trim(),
            },
          },
          limit: 100, // Adjust if needed
        })

        if (guestOrders.docs.length > 0) {
          console.log(`Found ${guestOrders.docs.length} guest orders to migrate for ${email}`)

          // Update each guest order to link to the new user
          await Promise.all(
            guestOrders.docs.map((order) =>
              payload.update({
                collection: 'orders',
                id: order.id,
                data: {
                  customer: user.id,
                  guestEmail: undefined, // Clear guest email since it's now linked to user
                },
              }),
            ),
          )

          console.log(`Successfully migrated ${guestOrders.docs.length} orders to user ${user.id}`)
        }
      } catch (migrationError) {
        // Log error but don't fail registration
        console.error('Error migrating guest orders:', migrationError)
      }

      // Return success - frontend will handle login
      return Response.json(
        {
          success: true,
          message: 'Registration successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            roles: user.roles,
          },
        },
        { status: 201 },
      )
    } catch (error: unknown) {
      console.error('Registration error:', error)

      // Handle specific PayloadCMS validation errors
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'ValidationError') {
          const validationError = error as { data?: unknown; message?: string }
          return Response.json(
            {
              error: 'Validation failed',
              details: validationError.data || validationError.message,
            },
            { status: 400 },
          )
        }

        if (error.name === 'MongoError' || error.name === 'BulkWriteError') {
          const dbError = error as { code?: number }
          if (dbError.code === 11000) {
            return Response.json({ error: 'Email already exists' }, { status: 409 })
          }
        }
      }

      return Response.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
    }
  },
}
