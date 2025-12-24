import type { Endpoint } from 'payload'
import { getGeoLocationFromRequest, updateUserLocation } from '@/utilities/geolocation'

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
      return Response.json({ error: 'فرمت درخواست نامعتبر است' }, { status: 400 })
    }

    const { email, password, firstName, lastName, phone } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return Response.json({ error: 'ایمیل، رمز عبور، نام و تخلص الزامی است' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'فرمت ایمیل نامعتبر است' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return Response.json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' }, { status: 400 })
    }

    try {
      // Check for existing user
      const existingUsers = await payload.find({
        collection: 'users',
        where: { email: { equals: email.toLowerCase().trim() } },
        limit: 1,
      })

      if (existingUsers.docs.length > 0) {
        const existingUser = existingUsers.docs[0]
        const authMethods = (existingUser.authMethods as string[]) || []

        // Provide helpful error message based on how they registered
        if (authMethods.includes('google') && !authMethods.includes('password')) {
          return Response.json(
            {
              error: 'این ایمیل با گوگل ثبت شده است. لطفاً با گوگل وارد شوید.',
              code: 'EMAIL_EXISTS_GOOGLE',
            },
            { status: 409 },
          )
        }

        return Response.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 409 })
      }

      // Create user - Payload CMS will automatically:
      // 1. Set _verified to false
      // 2. Generate _verificationToken
      // 3. Send verification email (using generateEmailHTML from auth.verify config)
      const user = await payload.create({
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

      // Update authMethods directly in MongoDB (system-managed field)
      // @ts-expect-error - accessing internal MongoDB connection
      const db = payload.db?.connection?.db || payload.db?.client?.db()
      if (db) {
        const mongoose = await import('mongoose')
        await db
          .collection('users')
          .updateOne(
            { _id: new mongoose.Types.ObjectId(user.id) },
            { $set: { authMethods: ['password'] } },
          )
      }

      console.log('User created successfully:', user.id)

      // Capture user location from IP (non-blocking)
      getGeoLocationFromRequest(req, 'register')
        .then((location) => updateUserLocation(payload, user.id, location))
        .catch((err) => console.error('Failed to capture location on registration:', err))

      // Migrate guest orders to the new user account
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
          console.log(`Found ${guestOrders.docs.length} guest orders to migrate for ${email}`)

          await Promise.all(
            guestOrders.docs.map((order) =>
              payload.update({
                collection: 'orders',
                id: order.id,
                data: {
                  customer: user.id,
                  guestEmail: undefined,
                },
              }),
            ),
          )

          console.log(`Successfully migrated ${guestOrders.docs.length} orders to user ${user.id}`)
        }
      } catch (migrationError) {
        console.error('Error migrating guest orders:', migrationError)
      }

      // Return success - frontend will show verification message
      return Response.json(
        {
          success: true,
          message: 'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تأیید کنید.',
          requiresVerification: true,
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

      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'ValidationError') {
          const validationError = error as { data?: unknown; message?: string }
          return Response.json(
            {
              error: 'اعتبارسنجی ناموفق بود',
              details: validationError.data || validationError.message,
            },
            { status: 400 },
          )
        }

        if (error.name === 'MongoError' || error.name === 'BulkWriteError') {
          const dbError = error as { code?: number }
          if (dbError.code === 11000) {
            return Response.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 409 })
          }
        }
      }

      return Response.json(
        { error: 'ثبت‌نام ناموفق بود. لطفاً دوباره امتحان کنید.' },
        { status: 500 },
      )
    }
  },
}
