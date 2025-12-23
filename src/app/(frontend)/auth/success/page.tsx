'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowLeft, Mail, Loader2, Sparkles } from 'lucide-react'
import { safeRedirect } from '@/utilities/redirect'
import Logo from '../../components/Logo'

export default function AuthSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type') || 'login'
  const name = searchParams.get('name') || ''
  const email = searchParams.get('email') || ''
  const redirect = searchParams.get('redirect') || '/'
  const verificationPending = searchParams.get('verification') === 'pending'
  const [countdown, setCountdown] = useState(3)
  const [isVerified, setIsVerified] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  // Check verification status
  const checkVerificationStatus = useCallback(async () => {
    if (!email || isVerified) return false

    setIsChecking(true)
    try {
      const response = await fetch('/api/check-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.verified) {
        setIsVerified(true)
        // Trigger cart merge since user is now logged in
        sessionStorage.setItem('justLoggedIn', 'true')
        window.dispatchEvent(new Event('userLoggedIn'))
        return true
      }
    } catch (error) {
      console.error('Error checking verification:', error)
    } finally {
      setIsChecking(false)
    }
    return false
  }, [email, isVerified])

  // Poll for verification status when pending
  useEffect(() => {
    if (!verificationPending || !email || isVerified) return

    // Check immediately
    checkVerificationStatus()

    // Then poll every 3 seconds
    const pollInterval = setInterval(() => {
      checkVerificationStatus()
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [verificationPending, email, isVerified, checkVerificationStatus])

  // Countdown and redirect after verification or login
  useEffect(() => {
    // Don't start countdown if verification is pending and not yet verified
    if (verificationPending && !isVerified) {
      return
    }

    // Set flag to trigger cart merge (for non-verification flows)
    if (!verificationPending) {
      sessionStorage.setItem('justLoggedIn', 'true')
      window.dispatchEvent(new Event('userLoggedIn'))
    }

    // Start countdown
    setCountdown(3)
  }, [verificationPending, isVerified])

  // Countdown timer
  useEffect(() => {
    if (verificationPending && !isVerified) return
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [verificationPending, isVerified, countdown])

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (verificationPending && !isVerified) return
    if (countdown !== 0) return

    const safeUrl = safeRedirect(redirect, '/')
    router.push(safeUrl)
  }, [countdown, redirect, router, verificationPending, isVerified])

  const isRegister = type === 'register'
  const safeUrl = safeRedirect(redirect, '/')

  // Determine current state
  const showVerificationPending = verificationPending && !isVerified
  const showVerificationSuccess = verificationPending && isVerified

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

          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                showVerificationPending
                  ? 'bg-warning/10'
                  : showVerificationSuccess
                    ? 'bg-success/10'
                    : 'bg-success/10'
              }`}
            >
              {showVerificationPending ? (
                <Mail className="w-10 h-10 text-warning" />
              ) : (
                <div className="relative">
                  <CheckCircle className="w-10 h-10 text-success" />
                  {isRegister && !showVerificationSuccess && (
                    <Sparkles className="w-5 h-5 text-primary absolute -top-1 -right-1" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-base-content mb-2">
              {showVerificationSuccess
                ? 'ایمیل تأیید شد!'
                : showVerificationPending
                  ? 'یک قدم دیگر!'
                  : isRegister
                    ? 'خوش آمدید!'
                    : 'ورود موفق'}
            </h1>

            {name && !showVerificationPending && (
              <p className="text-xl text-primary font-semibold">{name} عزیز</p>
            )}
          </div>

          {/* Verification Pending State */}
          {showVerificationPending && (
            <div className="space-y-4">
              <p className="text-base-content/70 text-center">
                حساب کاربری شما با موفقیت ایجاد شد.
              </p>

              <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5">
                <div className="flex items-center justify-center gap-2 mb-3">
                  {isChecking && <Loader2 className="w-4 h-4 text-warning animate-spin" />}
                  <p className="text-warning font-semibold">لطفاً ایمیل خود را تأیید کنید</p>
                </div>
                <p className="text-base-content/60 text-sm text-center leading-relaxed">
                  یک ایمیل تأیید به آدرس{' '}
                  <span className="font-medium text-base-content" dir="ltr">
                    {email}
                  </span>{' '}
                  ارسال شد.
                </p>
                <p className="text-base-content/60 text-sm text-center mt-2">
                  لطفاً روی لینک موجود در ایمیل کلیک کنید.
                </p>
              </div>

              <div className="bg-base-200/50 rounded-xl p-3 text-center">
                <p className="text-base-content/50 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  این صفحه بعد از تأیید ایمیل به‌روز می‌شود...
                </p>
              </div>
            </div>
          )}

          {/* Verification Success State */}
          {showVerificationSuccess && (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/20 rounded-2xl p-5 text-center">
                <p className="text-success font-semibold mb-1">حساب شما فعال شد!</p>
                <p className="text-base-content/60 text-sm">
                  ایمیل شما با موفقیت تأیید شد و وارد حساب کاربری شدید.
                </p>
              </div>

              <div className="bg-base-200 rounded-xl p-3 text-center">
                <p className="text-sm text-base-content/70">
                  به صفحه اصلی منتقل می‌شوید... ({countdown})
                </p>
              </div>
            </div>
          )}

          {/* Normal Login/Register Success State */}
          {!showVerificationPending && !showVerificationSuccess && (
            <div className="space-y-4">
              <p className="text-base-content/70 text-center">
                {isRegister ? 'حساب کاربری شما با موفقیت ایجاد شد.' : 'با موفقیت وارد شدید.'}
              </p>

              <div className="bg-base-200 rounded-xl p-3 text-center">
                <p className="text-sm text-base-content/70">در حال انتقال... ({countdown})</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6">
            <Link
              href={showVerificationPending ? '/auth/login' : safeUrl}
              className="btn btn-primary w-full gap-2"
            >
              {showVerificationPending ? 'بازگشت به صفحه ورود' : 'ادامه'}
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
