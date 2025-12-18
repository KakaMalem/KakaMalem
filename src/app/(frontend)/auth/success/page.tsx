'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ShoppingBag, Sparkles } from 'lucide-react'
import { safeRedirect } from '@/utilities/redirect'

export default function AuthSuccessPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'login' // 'login' or 'register'
  const name = searchParams.get('name') || ''
  const redirect = searchParams.get('redirect') || '/'
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Set flag to trigger cart merge
    sessionStorage.setItem('justLoggedIn', 'true')

    // Dispatch custom event for cart merge
    window.dispatchEvent(new Event('userLoggedIn'))

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Safely redirect
          const safeUrl = safeRedirect(redirect, '/')
          window.location.href = safeUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [redirect])

  const isRegister = type === 'register'

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-200">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full auth-blob-success-1 blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full auth-blob-success-2 blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full auth-blob-success-3 blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full auth-blob-success-4 blur-3xl animate-pulse"
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
        <div className="w-full max-w-md bg-base-100/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-base-300/50 border border-base-100/80 text-center">
          {/* Success Animation */}
          <div className="relative mb-8 h-32 flex items-center justify-center">
            {/* Animated circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-success/20 animate-ping" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-success/30 animate-pulse" />
            </div>

            {/* Icon */}
            <div className="relative z-10 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30 animate-bounce">
                <CheckCircle className="w-12 h-12 text-success-content" />
              </div>
            </div>

            {/* Sparkles */}
            <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-warning animate-pulse" />
            <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-warning animate-pulse delay-150" />
            <Sparkles className="absolute top-1/4 left-0 w-5 h-5 text-warning animate-pulse delay-300" />
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold mb-3 text-base-content">
            {isRegister ? 'خوش آمدید!' : 'ورود موفق!'}
          </h1>

          {name && <p className="text-xl text-primary font-semibold mb-2">{name} عزیز</p>}

          <p className="text-base-content/70 mb-6">
            {isRegister
              ? 'حساب کاربری شما با موفقیت ایجاد شد. از خرید در کاکا مالم لذت ببرید!'
              : 'با موفقیت وارد حساب کاربری خود شدید.'}
          </p>

          {/* Features for new users */}
          {isRegister && (
            <div className="bg-white/50 rounded-2xl p-6 mb-6 border border-white/80">
              <div className="flex items-center gap-3 text-right">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-base-content">آماده خرید هستید!</p>
                  <p className="text-sm text-base-content/70">هزاران محصول منتظر شماست</p>
                </div>
              </div>
            </div>
          )}

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 text-base-content/50">
            <div className="loading loading-spinner loading-sm" />
            <span>انتقال به صفحه اصلی در {countdown} ثانیه...</span>
          </div>

          {/* Manual redirect link */}
          <button
            onClick={() => {
              const safeUrl = safeRedirect(redirect, '/')
              window.location.href = safeUrl
            }}
            className="btn btn-link btn-sm mt-4 text-primary"
          >
            همین حالی برو
          </button>
        </div>
      </div>
    </div>
  )
}
