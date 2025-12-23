'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useCart } from '@/providers'
import Logo from '../../components/Logo'

type LogoutStatus = 'logging-out' | 'success' | 'error'

export default function LogoutPage() {
  const { refreshCart } = useCart()
  const router = useRouter()
  const [status, setStatus] = useState<LogoutStatus>('logging-out')
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
      router.push('/')
    }
  }, [status, countdown, router])

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

          {/* Logging Out State */}
          {status === 'logging-out' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-base-200 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-base-content/50 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">در حال خروج...</h1>
              <p className="text-base-content/60">لطفاً چند لحظه صبر کنید</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <LogOut className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">خروج موفق</h1>
              <p className="text-base-content/60 mb-6">با موفقیت از حساب کاربری خود خارج شدید.</p>

              <div className="bg-base-200 rounded-xl p-3 mb-6 text-center">
                <p className="text-sm text-base-content/70">
                  به صفحه اصلی منتقل می‌شوید... ({countdown})
                </p>
              </div>

              <Link href="/" className="btn btn-primary w-full gap-2">
                بازگشت به صفحه اصلی
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-error" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">خطا در خروج</h1>
              <p className="text-base-content/60 mb-8">
                مشکلی پیش آمده است. لطفاً دوباره تلاش کنید.
              </p>

              <div className="space-y-3">
                <button onClick={() => window.location.reload()} className="btn btn-primary w-full">
                  تلاش مجدد
                </button>
                <Link href="/" className="btn btn-ghost w-full">
                  بازگشت به صفحه اصلی
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
