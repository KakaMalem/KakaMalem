import type { Endpoint } from 'payload'
import crypto from 'crypto'

export const resendVerification: Endpoint = {
  path: '/resend-verification',
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
      // Find user by email with hidden fields to access _verified and _verificationToken
      const users = await payload.find({
        collection: 'users',
        where: {
          email: { equals: email.toLowerCase().trim() },
        },
        limit: 1,
        showHiddenFields: true,
      })

      // Always return success to prevent email enumeration
      if (users.docs.length === 0) {
        return Response.json(
          { message: 'اگر حسابی با این ایمیل وجود داشته باشد، ایمیل تأیید ارسال خواهد شد' },
          { status: 200 },
        )
      }

      const user = users.docs[0]
      const authMethods = (user.authMethods as string[]) || []
      const hasPasswordAuth = authMethods.includes('password')

      // Check if user is OAuth-only (no password auth) - they don't need email verification
      if (!hasPasswordAuth) {
        return Response.json(
          { message: 'اگر حسابی با این ایمیل وجود داشته باشد، ایمیل تأیید ارسال خواهد شد' },
          { status: 200 },
        )
      }

      // Check if already verified (using Payload's _verified field)
      if (user._verified) {
        return Response.json(
          { message: 'ایمیل شما قبلاً تأیید شده است', alreadyVerified: true },
          { status: 200 },
        )
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')

      // Update user with new token using Payload's hidden field
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          _verificationToken: verificationToken,
        } as Record<string, unknown>,
      })

      // Send verification email using the same template as in Users collection
      const verificationUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify-email?token=${verificationToken}`
      const firstName = user.firstName || 'کاربر'

      await payload.sendEmail({
        to: user.email,
        subject: 'تأیید ایمیل - کاکا معلم',
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="fa">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; direction: rtl;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;" dir="rtl">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" dir="rtl">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">کاکا معلم</h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px; text-align: right;" dir="rtl">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; text-align: right;">سلام ${firstName} عزیز،</h2>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
                          از ثبت‌نام شما در کاکا معلم متشکریم! لطفاً برای تأیید ایمیل آدرس خود روی دکمه زیر کلیک کنید.
                        </p>

                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;" dir="rtl">
                          <tr>
                            <td style="background-color: #dc2626; border-radius: 8px;">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                                تأیید ایمیل
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: right;">
                          اگر دکمه بالا کار نمی‌کند، لینک زیر را در مرورگر خود کپی و جایگذاری کنید:
                        </p>
                        <p style="color: #dc2626; font-size: 14px; word-break: break-all; margin: 10px 0 0 0; text-align: left; direction: ltr;">
                          <a href="${verificationUrl}" style="color: #dc2626;">${verificationUrl}</a>
                        </p>

                        <p style="color: #9ca3af; font-size: 13px; margin: 30px 0 0 0; text-align: right;">
                          این لینک تا ۲۴ ساعت معتبر است.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          اگر شما این درخواست را نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      })

      return Response.json(
        { message: 'ایمیل تأیید ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.' },
        { status: 200 },
      )
    } catch (error) {
      console.error('Resend verification error:', error)
      return Response.json(
        { error: 'خطا در ارسال ایمیل تأیید. لطفاً دوباره امتحان کنید.' },
        { status: 500 },
      )
    }
  },
}
