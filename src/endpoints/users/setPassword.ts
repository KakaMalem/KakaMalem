import type { Endpoint } from 'payload'

interface SetPasswordRequest {
  newPassword: string
  currentPassword?: string
}

/**
 * Set or change password for users
 * - OAuth-only users can set a password to enable password login
 * - Users with password auth can change their password (requires current password)
 */
export const setPassword: Endpoint = {
  path: '/set-password',
  method: 'post',
  handler: async (req) => {
    const { payload, user } = req

    if (!user) {
      return Response.json({ error: 'غیرمجاز' }, { status: 401 })
    }

    // Parse request body
    let body: SetPasswordRequest
    try {
      body = (await req.json?.()) || req.body
    } catch (_e) {
      return Response.json({ error: 'فرمت درخواست نامعتبر است' }, { status: 400 })
    }

    const { newPassword, currentPassword } = body

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      return Response.json({ error: 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد' }, { status: 400 })
    }

    const authMethods = (user.authMethods as string[]) || []
    const hasPasswordAuth = authMethods.includes('password')

    // If user already has password auth, require current password
    if (hasPasswordAuth) {
      if (!currentPassword) {
        return Response.json(
          { error: 'رمز عبور فعلی برای تغییر رمز عبور الزامی است' },
          { status: 400 },
        )
      }

      // Verify current password
      try {
        await payload.login({
          collection: 'users',
          data: {
            email: user.email,
            password: currentPassword,
          },
        })
      } catch (_error) {
        return Response.json({ error: 'رمز عبور فعلی اشتباه است' }, { status: 400 })
      }

      // Check if new password is the same as current password
      if (currentPassword === newPassword) {
        return Response.json(
          { error: 'رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد' },
          { status: 400 },
        )
      }
    }

    try {
      // Update password
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          password: newPassword,
        },
      })

      // If user didn't have password auth before, add it to authMethods
      if (!hasPasswordAuth) {
        // @ts-expect-error - accessing internal MongoDB connection
        const db = payload.db?.connection?.db || payload.db?.client?.db()
        if (db) {
          const mongoose = await import('mongoose')
          await db
            .collection('users')
            .updateOne(
              { _id: new mongoose.Types.ObjectId(user.id) },
              { $addToSet: { authMethods: 'password' } },
            )
        }
      }

      return Response.json({
        success: true,
        message: hasPasswordAuth
          ? 'رمز عبور با موفقیت تغییر کرد'
          : 'رمز عبور با موفقیت ایجاد شد. اکنون می‌توانید با ایمیل و رمز عبور وارد شوید.',
        authMethods: hasPasswordAuth ? authMethods : [...authMethods, 'password'],
      })
    } catch (error) {
      console.error('Error setting password:', error)
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'تنظیم رمز عبور ناموفق بود. لطفاً دوباره امتحان کنید.',
        },
        { status: 500 },
      )
    }
  },
}
