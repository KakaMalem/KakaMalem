'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Logo from '../../components/Logo'

type VerificationStatus = 'loading' | 'success' | 'already_verified' | 'error' | 'no_token'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [userName, setUserName] = useState('')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!token) {
      setStatus('no_token')
      return
    }

    const verifyEmail = async () => {
      try {
        // Use custom verify endpoint with auto-login
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          if (data.alreadyVerified) {
            setStatus('already_verified')
          } else {
            setStatus('success')
            // Get user name for greeting
            if (data.user?.firstName) {
              setUserName(data.user.firstName)
            }
          }
        } else {
          setStatus('error')
          setErrorMessage(data.error || 'توکن تأیید نامعتبر یا منقضی شده است')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setErrorMessage('خطا در اتصال به سرور')
      }
    }

    verifyEmail()
  }, [token])

  // Countdown and redirect after successful verification
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

          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">در حال تأیید ایمیل...</h1>
              <p className="text-base-content/60">لطفاً صبر کنید</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">
                {userName ? `${userName} عزیز، خوش آمدید!` : 'ایمیل تأیید شد!'}
              </h1>
              <p className="text-base-content/60 mb-6">
                ایمیل شما با موفقیت تأیید شد و وارد حساب کاربری شدید.
              </p>
              <div className="bg-base-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-base-content/70">
                  به صفحه اصلی منتقل می‌شوید... ({countdown})
                </p>
              </div>
              <Link href="/" className="btn btn-primary w-full gap-2">
                رفتن به صفحه اصلی
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Already Verified State */}
          {status === 'already_verified' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-info/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-info" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">ایمیل قبلاً تأیید شده</h1>
              <p className="text-base-content/60 mb-8">
                ایمیل شما قبلاً تأیید شده است. می‌توانید وارد حساب کاربری خود شوید.
              </p>
              <Link href="/auth/login" className="btn btn-primary w-full gap-2">
                ورود به حساب کاربری
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* No Token State */}
          {status === 'no_token' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-warning" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">لینک نامعتبر</h1>
              <p className="text-base-content/60 mb-8">
                لینک تأیید ایمیل نامعتبر است. لطفاً از لینک موجود در ایمیل خود استفاده کنید.
              </p>
              <Link href="/auth/login" className="btn btn-outline w-full">
                بازگشت به صفحه ورود
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">خطا در تأیید ایمیل</h1>
              <p className="text-base-content/60 mb-8">{errorMessage}</p>
              <div className="space-y-3">
                <Link href="/auth/login" className="btn btn-primary w-full">
                  بازگشت به صفحه ورود
                </Link>
                <p className="text-sm text-base-content/50">
                  می‌توانید از صفحه ورود درخواست ارسال مجدد ایمیل تأیید کنید.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
