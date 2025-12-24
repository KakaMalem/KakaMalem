'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  ArrowLeft,
  Loader2,
  Shield,
  Truck,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Navigation,
} from 'lucide-react'
import { useLocationPermission } from '@/hooks/useLocationPermission'
import { safeRedirect } from '@/utilities/redirect'
import Logo from '../../components/Logo'

function LocationPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = searchParams.get('redirect') || '/'
  const name = searchParams.get('name') || ''

  const {
    permissionState,
    isCheckingPermission,
    requestLocation,
    updateServerLocation,
    dismissPrompt,
  } = useLocationPermission()

  const [isRequesting, setIsRequesting] = useState(false)
  const [locationResult, setLocationResult] = useState<'success' | 'denied' | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Handle location request
  const handleAllowLocation = useCallback(async () => {
    setIsRequesting(true)
    try {
      const position = await requestLocation()
      if (position) {
        await updateServerLocation(position)
        setLocationResult('success')
        setCountdown(3)
      } else {
        setLocationResult('denied')
        setCountdown(3)
      }
    } catch (error) {
      console.error('Location error:', error)
      setLocationResult('denied')
      setCountdown(3)
    } finally {
      setIsRequesting(false)
    }
  }, [requestLocation, updateServerLocation])

  // Handle skip
  const handleSkip = useCallback(() => {
    dismissPrompt()
    const safeUrl = safeRedirect(redirect, '/')
    router.push(safeUrl)
  }, [dismissPrompt, redirect, router])

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      const safeUrl = safeRedirect(redirect, '/')
      router.push(safeUrl)
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, redirect, router])

  // If permission is already granted or denied, skip this page
  useEffect(() => {
    if (isCheckingPermission) return
    if (permissionState === 'granted' || permissionState === 'denied') {
      const safeUrl = safeRedirect(redirect, '/')
      router.push(safeUrl)
    }
  }, [isCheckingPermission, permissionState, redirect, router])

  const safeUrl = safeRedirect(redirect, '/')

  // Loading state
  if (isCheckingPermission) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-base-200 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-200">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse"
          style={{
            background:
              'radial-gradient(circle, oklch(75% 0.18 150 / 0.4), oklch(60% 0.15 180 / 0.2))',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[550px] h-[550px] rounded-full blur-3xl animate-pulse"
          style={{
            background:
              'radial-gradient(circle, oklch(70% 0.2 200 / 0.4), oklch(55% 0.18 230 / 0.2))',
            animationDuration: '10s',
            animationDelay: '1s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl animate-pulse"
          style={{
            background:
              'radial-gradient(circle, oklch(65% 0.15 170 / 0.3), oklch(50% 0.12 190 / 0.15))',
            animationDuration: '12s',
            animationDelay: '2s',
          }}
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, oklch(50% 0.1 180 / 0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Centered Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg bg-base-100/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-base-300/50 border border-base-100/80">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          {/* Success/Error Result */}
          {locationResult && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    locationResult === 'success' ? 'bg-success/10' : 'bg-warning/10'
                  }`}
                >
                  {locationResult === 'success' ? (
                    <CheckCircle2 className="w-12 h-12 text-success" />
                  ) : (
                    <XCircle className="w-12 h-12 text-warning" />
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-base-content mb-2">
                  {locationResult === 'success' ? 'موقعیت ثبت شد!' : 'موقعیت دریافت نشد'}
                </h1>
                <p className="text-base-content/70">
                  {locationResult === 'success'
                    ? 'ممنون که به ما اعتماد کردید. تجربه خرید بهتری خواهید داشت.'
                    : 'مشکلی نیست! همچنان می‌توانید از سایت استفاده کنید.'}
                </p>
              </div>

              {/* Countdown */}
              <div className="bg-base-200 rounded-xl p-3 text-center mb-6">
                <p className="text-sm text-base-content/70">در حال انتقال... ({countdown})</p>
              </div>

              {/* Continue Button */}
              <Link href={safeUrl} className="btn btn-primary w-full gap-2">
                ادامه
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Location Request UI */}
          {!locationResult && (
            <>
              {/* Animated Location Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center animate-pulse">
                      <MapPin className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  {/* Floating animation rings */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <div
                    className="absolute -inset-2 rounded-full border border-primary/20 animate-ping"
                    style={{ animationDuration: '3s', animationDelay: '0.5s' }}
                  />
                </div>
              </div>

              {/* Welcome Message */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-base-content mb-2">
                  {name ? `${name} عزیز،` : 'خوش آمدید!'}
                </h1>
                <p className="text-lg text-primary font-semibold mb-3">
                  موقعیت خود را با ما به اشتراک بگذارید
                </p>
                <p className="text-base-content/60 text-sm leading-relaxed">
                  با اشتراک‌گذاری موقعیت، تجربه خرید شخصی‌تر و ارسال سریع‌تری خواهید داشت.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-4 p-3 bg-base-200/50 rounded-xl border border-base-300/50">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-base-content">ارسال دقیق‌تر</h3>
                    <p className="text-xs text-base-content/60">
                      سفارش شما به نزدیک‌ترین مرکز ارسال می‌شود
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-base-content/30 shrink-0" />
                </div>

                <div className="flex items-center gap-4 p-3 bg-base-200/50 rounded-xl border border-base-300/50">
                  <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-base-content">تحویل سریع‌تر</h3>
                    <p className="text-xs text-base-content/60">زمان تحویل دقیق‌تر و انتظار کمتر</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-base-content/30 shrink-0" />
                </div>

                <div className="flex items-center gap-4 p-3 bg-base-200/50 rounded-xl border border-base-300/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-base-content">تجربه شخصی‌تر</h3>
                    <p className="text-xs text-base-content/60">
                      محصولات و پیشنهادات متناسب با منطقه شما
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-base-content/30 shrink-0" />
                </div>
              </div>

              {/* Privacy Note */}
              <div className="flex items-start gap-3 p-3 bg-success/5 rounded-xl border border-success/20 mb-6">
                <Shield className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <p className="text-xs text-base-content/70 leading-relaxed">
                  اطلاعات موقعیت شما{' '}
                  <span className="font-semibold text-success">کاملاً محرمانه</span> است و فقط برای
                  بهبود خدمات استفاده می‌شود. هر زمان می‌توانید این دسترسی را لغو کنید.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAllowLocation}
                  disabled={isRequesting}
                  className="btn btn-primary w-full gap-2 h-12 text-base"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال دریافت موقعیت...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      اجازه دسترسی به موقعیت
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  disabled={isRequesting}
                  className="btn btn-ghost w-full gap-2 text-base-content/60 hover:text-base-content"
                >
                  فعلاً نه، بعداً تنظیم می‌کنم
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LocationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <LocationPageContent />
    </Suspense>
  )
}
