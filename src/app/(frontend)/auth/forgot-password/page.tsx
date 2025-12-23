'use client'

import React, { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Logo from '../../components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'خطایی رخ داد')
      }

      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'خطایی در ارسال ایمیل بازیابی رخ داد'
      setError(errorMessage)
    } finally {
      setLoading(false)
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

      {/* Centered Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-base-100/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-base-300/50 border border-base-100/80">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-base-content mb-2">بازیابی رمز عبور</h1>
            <p className="text-base-content/70">
              ایمیل آدرس خود را وارد کنید تا لینک بازیابی رمز عبور برایتان ارسال شود.
            </p>
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
                  <h3 className="font-bold">ایمیل ارسال شد!</h3>
                  <div className="text-sm">
                    اگر حساب کاربری با این ایمیل وجود داشته باشد، لینک بازیابی رمز عبور برایتان
                    ارسال می‌شود.
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-base-content/70 mb-4">
                  ایمیل خود را بررسی کنید و روی لینک کلیک کنید.
                </p>
                <Link href="/auth/login" className="btn btn-primary">
                  <ArrowLeft className="w-4 h-4" />
                  بازگشت به صفحه ورود
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
                {/* Email */}
                <div className="fieldset">
                  <label className="label">
                    <span className="label-text font-medium">ایمیل آدرس</span>
                  </label>
                  <label className="input w-full flex items-center gap-2">
                    <Mail className="w-4 h-4 opacity-70 text-secondary" />
                    <input
                      type="email"
                      className="grow"
                      placeholder="your-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                    />
                  </label>
                </div>

                {/* Submit Button */}
                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading loading-spinner" />
                      در حال ارسال...
                    </>
                  ) : (
                    'ارسال لینک بازیابی'
                  )}
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
