'use client'

import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Logo from '../../components/Logo'
import { CapsLockDetector } from '../../components/CapsLockDetector'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('لینک بازیابی نامعتبر است. لطفاً مجدداً درخواست بازیابی رمز عبور دهید.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'خطایی در تغییر رمز عبور رخ داد')
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'خطایی در تغییر رمز عبور رخ داد'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-base-100">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-6">
            <Logo />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">تنظیم رمز عبور جدید</h1>
            <p className="text-base-content/70">رمز عبور جدید خود را وارد کنید.</p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="space-y-6">
              <div className="alert alert-success">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold">رمز عبور تغییر کرد!</h3>
                  <div className="text-sm">
                    رمز عبور شما با موفقیت تغییر کرد. در حال انتقال به صفحه ورود...
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/auth/login" className="btn btn-primary">
                  <ArrowLeft className="w-4 h-4" />
                  رفتن به صفحه ورود
                </Link>
              </div>
            </div>
          ) : !token ? (
            // Invalid Token Message
            <div className="space-y-6">
              <div className="alert alert-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold">لینک نامعتبر</h3>
                  <div className="text-sm">لینک بازیابی رمز عبور نامعتبر است یا منقضی شده است.</div>
                </div>
              </div>

              <div className="text-center">
                <Link href="/auth/forgot-password" className="btn btn-primary">
                  درخواست لینک جدید
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="alert alert-error mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div className="fieldset">
                  <label className="label">
                    <span className="label-text font-medium">رمز عبور جدید</span>
                  </label>
                  <CapsLockDetector>
                    {(active: boolean) => (
                      <>
                        <label className="input w-full flex items-center gap-2">
                          <Lock className="w-4 h-4 opacity-70 text-secondary" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            className="grow"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            dir="ltr"
                            style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="btn btn-ghost btn-xs btn-circle"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </label>
                        {active && (
                          <label className="label">
                            <span className="label-text-alt text-warning flex items-center gap-1">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              کلید Caps Lock فعال است
                            </span>
                          </label>
                        )}
                      </>
                    )}
                  </CapsLockDetector>
                </div>

                {/* Confirm Password */}
                <div className="fieldset">
                  <label className="label">
                    <span className="label-text font-medium">تکرار رمز عبور جدید</span>
                  </label>
                  <label className="input w-full flex items-center gap-2">
                    <Lock className="w-4 h-4 opacity-70 text-secondary" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="grow"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="btn btn-ghost btn-xs btn-circle"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </label>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading loading-spinner" />
                      در حال تغییر رمز عبور...
                    </>
                  ) : (
                    'تغییر رمز عبور'
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="link link-primary inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  بازگشت به صفحه ورود
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12 text-white">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <ShieldCheck className="w-24 h-24 mx-auto mb-6 opacity-90" />
          </div>
          <h2 className="text-5xl font-bold mb-6">امنیت حساب شما</h2>
          <p className="text-xl opacity-90 mb-8">
            یک رمز عبور قوی انتخاب کنید که شامل حروف بزرگ، کوچک، اعداد و نمادها باشد.
          </p>
          <div className="bg-white/10 rounded-xl p-6 text-right">
            <h3 className="text-lg font-semibold mb-4">نکات امنیتی:</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• از رمز عبور منحصر به فرد استفاده کنید</li>
              <li>• حداقل ۸ کاراکتر انتخاب کنید</li>
              <li>• از ترکیب حروف و اعداد استفاده کنید</li>
              <li>• از اطلاعات شخصی استفاده نکنید</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
