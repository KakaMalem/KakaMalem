'use client'

import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft, Loader2, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Logo from '../../components/Logo'
import { CapsLockDetector } from '../../components/CapsLockDetector'

type ResetStatus = 'form' | 'loading' | 'success' | 'error' | 'no_token'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<ResetStatus>('form')
  const [errorMessage, setErrorMessage] = useState('')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!token) {
      setStatus('no_token')
    }
  }, [token])

  // Countdown timer after success
  useEffect(() => {
    if (status !== 'success') return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (status === 'success' && countdown === 0) {
      router.push('/auth/login')
    }
  }, [status, countdown, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage('رمز عبور و تکرار آن یکسان نیستند')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setErrorMessage('رمز عبور باید حداقل ۸ کاراکتر باشد')
      return
    }

    setStatus('loading')

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

      setStatus('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطایی در تغییر رمز عبور رخ داد'
      setErrorMessage(message)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-200">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full auth-blob-1 blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full auth-blob-2 blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full auth-blob-3 blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full auth-blob-4 blur-3xl animate-pulse"
          style={{ animationDuration: '9s', animationDelay: '3s' }}
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, oklch(40% 0.01 264 / 0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Centered Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-base-100/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-base-300/50 border border-base-100/80">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">
                در حال تغییر رمز عبور...
              </h1>
              <p className="text-base-content/60">لطفاً صبر کنید</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">رمز عبور تغییر کرد!</h1>
              <p className="text-base-content/60 mb-6">
                رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید با رمز عبور جدید وارد شوید.
              </p>
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-base-content/70">
                  به صفحه ورود منتقل می‌شوید... ({countdown})
                </p>
              </div>
              <Link href="/auth/login" className="btn btn-primary w-full gap-2">
                رفتن به صفحه ورود
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* No Token State */}
          {status === 'no_token' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-warning" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">لینک نامعتبر</h1>
              <p className="text-base-content/60 mb-8">
                لینک بازیابی رمز عبور نامعتبر است یا منقضی شده است. لطفاً مجدداً درخواست بازیابی رمز
                عبور دهید.
              </p>
              <Link href="/auth/forgot-password" className="btn btn-primary w-full gap-2">
                درخواست لینک جدید
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">خطا در تغییر رمز عبور</h1>
              <p className="text-base-content/60 mb-8">{errorMessage}</p>
              <div className="space-y-3">
                <button onClick={() => setStatus('form')} className="btn btn-primary w-full">
                  تلاش مجدد
                </button>
                <Link href="/auth/forgot-password" className="btn btn-outline w-full">
                  درخواست لینک جدید
                </Link>
              </div>
            </div>
          )}

          {/* Form State */}
          {status === 'form' && token && (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-base-content mb-2">تنظیم رمز عبور جدید</h1>
                <p className="text-base-content/70">رمز عبور جدید خود را وارد کنید.</p>
              </div>

              {/* Inline Error */}
              {errorMessage && (
                <div className="alert alert-error mb-6">
                  <XCircle className="w-5 h-5" />
                  <span>{errorMessage}</span>
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
                  <p className="text-xs text-base-content/50 mt-1">حداقل ۸ کاراکتر</p>
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
                <button type="submit" className="btn btn-primary btn-block">
                  تغییر رمز عبور
                </button>
              </form>

              {/* Back to Login */}
              <p className="text-center mt-8 text-base-content/80">
                رمز عبور خود را به یاد آوردید؟{' '}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                  ورود
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
