import type { Endpoint } from 'payload'

/**
 * Check email verification status
 * Used by the success page to poll for verification completion
 */
export const checkVerification: Endpoint = {
  path: '/check-verification',
  method: 'post',
  handler: async (req) => {
    const { payload } = req

    // Parse request body
    let body: { email?: string }
    try {
      body = (await req.json?.()) || req.body || {}
    } catch (_e) {
      body = {}
    }

    const { email } = body

    if (!email) {
      return Response.json({ error: 'ایمیل الزامی است' }, { status: 400 })
    }

    try {
      // Find user by email
      const users = await payload.find({
        collection: 'users',
        where: {
          email: { equals: email.toLowerCase().trim() },
        },
        limit: 1,
        showHiddenFields: true,
      })

      if (users.docs.length === 0) {
        return Response.json({ error: 'کاربر یافت نشد' }, { status: 404 })
      }

      const user = users.docs[0]

      // Check if verified
      if (user._verified) {
        // User is verified - log them in
        const tempPassword = crypto.randomUUID() + crypto.randomUUID()

        // @ts-expect-error - accessing internal MongoDB connection
        const db = payload.db?.connection?.db || payload.db?.client?.db()

        if (db) {
          const mongoose = await import('mongoose')

          // Get the current password hash
          const userDoc = await db
            .collection('users')
            .findOne({ _id: new mongoose.Types.ObjectId(user.id) })

          const originalHash = userDoc?.hash || null
          const originalSalt = userDoc?.salt || null

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

          // Build cookie
          const cookieName = `${payload.config.cookiePrefix || 'payload'}-token`
          const cookieExpiration = 60 * 60 * 24 // 24 hours
          const isLocalNetwork =
            req.headers.get('host')?.includes('192.168.') ||
            req.headers.get('host')?.includes('localhost')
          const isSecure = process.env.NODE_ENV === 'production' && !isLocalNetwork

          const response = Response.json(
            {
              verified: true,
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

        // Fallback without login
        return Response.json({ verified: true }, { status: 200 })
      }

      // Not verified yet
      return Response.json({ verified: false }, { status: 200 })
    } catch (error) {
      console.error('Check verification error:', error)
      return Response.json({ error: 'خطا در بررسی وضعیت تأیید' }, { status: 500 })
    }
  },
}
