'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, LogOut, AlertCircle } from 'lucide-react'
import { useCart } from '@/providers'

export default function LogoutPage() {
  const { refreshCart } = useCart()
  const [status, setStatus] = useState<'logging-out' | 'success' | 'error'>('logging-out')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const performLogout = async () => {
      // Clear any session storage flags
      sessionStorage.removeItem('justLoggedIn')

      // Clear local storage auth-related data
      try {
        localStorage.removeItem('payload-token')
      } catch (_) {
        // Ignore localStorage errors
      }

      // Clear the HTTP-only cookie by setting it to expire immediately
      document.cookie =
        'payload-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'

      try {
        // Still try to call the logout endpoint, but don't fail if it errors
        await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        // Ignore logout endpoint errors since we've already cleared client-side
        console.log('Server logout skipped:', error)
      }

      // Refresh cart to get new empty guest cart
      await refreshCart()

      // Dispatch event to notify other components
      window.dispatchEvent(new Event('userLoggedOut'))

      setStatus('success')
    }

    performLogout()
  }, [refreshCart])

  // Separate useEffect for countdown and redirect
  useEffect(() => {
    if (status !== 'success') return

    if (countdown <= 0) {
      window.location.href = '/'
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [status, countdown])

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-200">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full auth-blob-neutral-1 blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full auth-blob-neutral-2 blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full auth-blob-neutral-3 blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full auth-blob-neutral-4 blur-3xl animate-pulse"
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
          {status === 'logging-out' && (
            <>
              {/* Loading Animation */}
              <div className="relative mb-8 h-24 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-base-300/50 animate-pulse" />
                </div>
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center shadow-lg">
                    <LogOut className="w-10 h-10 text-base-content/70 animate-pulse" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-base-content mb-2">در حال خروج...</h1>
              <p className="text-base-content/70">لطفاً چند لحظه صبر کنید</p>

              <div className="flex justify-center mt-6">
                <span className="loading loading-dots loading-md text-base-content/50"></span>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              {/* Success Animation */}
              <div className="relative mb-8 h-24 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-success/20 animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-success/30 animate-pulse" />
                </div>
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30 animate-bounce">
                    <CheckCircle className="w-10 h-10 text-success-content" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-base-content mb-2">خروج موفق</h1>
              <p className="text-base-content/70 mb-6">با موفقیت از حساب کاربری خود خارج شدید.</p>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-2 text-base-content/50 mb-4">
                <div className="loading loading-spinner loading-sm" />
                <span>انتقال به صفحه اصلی در {countdown} ثانیه...</span>
              </div>

              <button
                onClick={() => (window.location.href = '/')}
                className="btn btn-primary btn-sm"
              >
                همین حالی برو
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              {/* Error Animation */}
              <div className="relative mb-8 h-24 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-error/20 animate-pulse" />
                </div>
                <div className="relative z-10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-lg shadow-error/30">
                    <AlertCircle className="w-10 h-10 text-error-content" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-base-content mb-2">خطا در خروج</h1>
              <p className="text-base-content/70 mb-6">
                مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
              </p>

              <div className="flex gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="btn btn-primary btn-sm">
                  تلاش مجدد
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="btn btn-ghost btn-sm"
                >
                  صفحه اصلی
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
