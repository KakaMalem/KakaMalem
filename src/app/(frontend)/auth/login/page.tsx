'use client'

import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import Logo from '../../components/Logo'
import { getRedirectUrl } from '@/utilities/redirect'
import { CapsLockDetector } from '../../components/CapsLockDetector'
import { signInWithGoogle } from '../actions'
import ClearInvalidToken from '../components/ClearInvalidToken'

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    if (!email.trim()) {
      errors.email = 'ایمیل الزامی است'
    } else if (!validateEmail(email)) {
      errors.email = 'فرمت ایمیل نامعتبر است'
    }

    if (!password) {
      errors.password = 'رمز عبور الزامی است'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Clear field error when user starts typing
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }))
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setFieldErrors({})

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          stayLoggedIn: rememberMe,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        switch (response.status) {
          case 404:
            // User not found - show on email field
            setFieldErrors({ email: 'کاربری با این ایمیل یافت نشد' })
            break
          case 401:
            // Wrong password - show on password field and reveal forgot password link
            setFieldErrors({ password: 'رمز عبور اشتباه است' })
            setShowForgotPassword(true)
            break
          case 403:
            // Account locked - show toast
            toast.error('حساب کاربری قفل شده است. لطفاً با پشتیبانی تماس بگیرید.', {
              duration: 5000,
            })
            break
          default:
            toast.error(data.error || 'ورود ناموفق بود')
        }
        return
      }

      // Get user name for success page
      const userName = data.user?.firstName || ''

      // Get redirect URL from query params
      const redirectUrl = getRedirectUrl(searchParams) || '/'

      // Redirect to success page
      const successUrl = `/auth/success?type=login&name=${encodeURIComponent(userName)}&redirect=${encodeURIComponent(redirectUrl)}`
      window.location.href = successUrl
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        toast.error('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        toast.error('خطایی در ورود رخ داد')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-200">
      {/* Auto-clear invalid tokens */}
      <ClearInvalidToken />

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
            <h1 className="text-3xl font-bold text-base-content mb-2">خوش آمدید</h1>
            <p className="text-base-content/70">وارد حساب کاربری خود شوید</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="fieldset">
              <label className="label">
                <span className="label-text font-medium">آدرس ایمیل</span>
              </label>
              <label
                className={`input w-full flex items-center gap-2 ${fieldErrors.email ? 'input-error' : ''}`}
              >
                <Mail
                  className={`w-4 h-4 opacity-70 ${fieldErrors.email ? 'text-error' : 'text-secondary'}`}
                />
                <input
                  type="email"
                  className="grow"
                  placeholder="your-email@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </label>
              {fieldErrors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.email}</span>
                </label>
              )}
            </div>

            {/* Password */}
            <div className="fieldset">
              <label className="label">
                <span className="label-text font-medium">رمز عبور</span>
              </label>
              <CapsLockDetector>
                {(active: boolean) => (
                  <>
                    <label
                      className={`input w-full flex items-center gap-2 ${fieldErrors.password ? 'input-error' : ''}`}
                    >
                      <Lock
                        className={`w-4 h-4 opacity-70 ${fieldErrors.password ? 'text-error' : 'text-secondary'}`}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="grow"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
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
                    {(fieldErrors.password || active) && (
                      <label className="label">
                        {fieldErrors.password && (
                          <span className="label-text-alt text-error">{fieldErrors.password}</span>
                        )}
                        {active && (
                          <span className="label-text-alt text-warning flex items-center gap-1 mr-auto">
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
                        )}
                      </label>
                    )}
                  </>
                )}
              </CapsLockDetector>
            </div>

            {/* Remember Me */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="label cursor-pointer gap-2 p-0">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="label-text">مرا به خاطر بسپار</span>
              </label>
              {showForgotPassword && (
                <Link href="/auth/forgot-password" className="link link-primary text-sm">
                  رمز عبور را فراموش کرده‌اید؟
                </Link>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner" />
                  در حال ورود...
                </>
              ) : (
                'ورود'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-6 text-base-content/50 before:bg-base-300 after:bg-base-300">
            یا
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <form
              action={(_formData) => {
                const redirectUrl = getRedirectUrl(searchParams)
                return signInWithGoogle(redirectUrl || undefined)
              }}
            >
              <button className="btn w-full bg-white text-black border-[#e5e5e5]" dir="ltr">
                <svg
                  aria-label="Google logo"
                  width="16"
                  height="16"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <g>
                    <path d="m0 0H512V512H0" fill="#fff"></path>
                    <path
                      fill="#34a853"
                      d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
                    ></path>
                    <path
                      fill="#4285f4"
                      d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
                    ></path>
                    <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
                    <path
                      fill="#ea4335"
                      d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
                    ></path>
                  </g>
                </svg>
                Continue with Google
              </button>
            </form>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-base-content/80">
            حساب کاربری ندارید؟{' '}
            <Link
              href={
                searchParams.get('redirect')
                  ? `/auth/register?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
                  : '/auth/register'
              }
              className="text-primary font-semibold hover:underline"
            >
              ثبت‌نام
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
