import type { Endpoint } from 'payload'

interface SetPasswordRequest {
  newPassword: string
  currentPassword?: string
}

/**
 * Set password for OAuth users who don't have a custom password yet
 * This endpoint is specifically for users who signed up via OAuth (Google, etc.)
 * and want to create a password to enable password-based login
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

    // If user has a sub field (OAuth user) and hasn't set a password yet,
    // allow them to set password without verification
    const needsToSetPassword = !!user.sub && !user.hasPassword

    if (!needsToSetPassword && !currentPassword) {
      // User trying to change password without current password
      return Response.json(
        { error: 'رمز عبور فعلی برای تغییر رمز عبور الزامی است' },
        { status: 400 },
      )
    }

    if (!needsToSetPassword && currentPassword) {
      // Verify current password for users who already have one
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
      // Update password and mark that user now has a password
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          password: newPassword,
          hasPassword: true,
        },
      })

      return Response.json({
        success: true,
        message: needsToSetPassword
          ? 'رمز عبور با موفقیت ایجاد شد'
          : 'رمز عبور با موفقیت تغییر کرد',
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
