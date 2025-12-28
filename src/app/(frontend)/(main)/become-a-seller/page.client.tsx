'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Store,
  Package,
  TrendingUp,
  Users,
  Shield,
  Zap,
  ArrowLeft,
  Check,
  Loader2,
} from 'lucide-react'
import type { User } from '@/payload-types'

interface BecomeSellerClientProps {
  user: User | null
}

export default function BecomeSellerClient({ user }: BecomeSellerClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'info' | 'form'>('info')
  const [formData, setFormData] = useState({
    storeName: '',
    storeSlug: '',
    description: '',
    contactPhone: '',
    agreeToTerms: false,
  })

  const features = [
    {
      icon: <Store className="w-8 h-8" />,
      title: 'فروشگاه اختصاصی',
      description: 'فروشگاه آنلاین خود را با برند و هویت بصری منحصر به فرد راه‌اندازی کنید.',
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: 'مدیریت محصولات',
      description: 'به راحتی محصولات خود را اضافه، ویرایش و مدیریت کنید.',
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'آمار و تحلیل',
      description: 'عملکرد فروشگاه خود را با گزارش‌های جامع پیگیری کنید.',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'دسترسی به مشتریان',
      description: 'محصولات شما را هزاران مشتری فعال در کاکا معلم می‌بینند.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'پرداخت امن',
      description: 'سیستم پرداخت امن و تضمین شده برای معاملات شما.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'راه‌اندازی سریع',
      description: 'در کمتر از ۵ دقیقه فروشگاه خود را راه‌اندازی کنید.',
    },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    if (name === 'storeName') {
      // Auto-generate slug from store name
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData((prev) => ({
        ...prev,
        storeName: value,
        storeSlug: slug,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      // Store form data in session and redirect to login
      sessionStorage.setItem('becomeSellerData', JSON.stringify(formData))
      router.push('/auth/login?redirect=/become-a-seller')
      return
    }

    if (!formData.agreeToTerms) {
      toast.error('لطفا قوانین و مقررات را بپذیرید')
      return
    }

    setIsLoading(true)

    try {
      // Use custom endpoint that handles role upgrade and storefront creation
      const res = await fetch('/api/create-storefront', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.storeName,
          slug: formData.storeSlug,
          description: formData.description,
          contactPhone: formData.contactPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'خطا در ایجاد فروشگاه')
      }

      toast.success('فروشگاه شما با موفقیت ایجاد شد!')
      router.push('/dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ایجاد فروشگاه')
    } finally {
      setIsLoading(false)
    }
  }

  // Check for stored form data on mount (for after login redirect)
  React.useEffect(() => {
    const storedData = sessionStorage.getItem('becomeSellerData')
    if (storedData && user) {
      const data = JSON.parse(storedData)
      setFormData(data)
      setStep('form')
      sessionStorage.removeItem('becomeSellerData')
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      {/* Hero Section */}
      <div className="bg-primary text-primary-content py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              فروشگاه آنلاین خود را راه‌اندازی کنید
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              به جامعه فروشندگان کاکا معلم بپیوندید و محصولات خود را به هزاران مشتری در سراسر
              افغانستان بفروشید.
            </p>
            {step === 'info' && (
              <button
                onClick={() => setStep('form')}
                className="btn btn-lg bg-white text-primary hover:bg-gray-100 gap-2"
              >
                شروع کنید
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {step === 'info' ? (
        <>
          {/* Features Grid */}
          <div className="max-w-7xl mx-auto px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              چرا کاکا معلم را انتخاب کنید؟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card bg-base-100 shadow-lg">
                  <div className="card-body items-center text-center">
                    <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="card-title">{feature.title}</h3>
                    <p className="text-base-content/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-base-200 py-16">
            <div className="max-w-3xl mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">آماده شروع هستید؟</h2>
              <p className="text-base-content/70 mb-8">
                ثبت‌نام رایگان است و در کمتر از ۵ دقیقه فروشگاه خود را راه‌اندازی کنید.
              </p>
              <button onClick={() => setStep('form')} className="btn btn-primary btn-lg gap-2">
                ایجاد فروشگاه رایگان
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Registration Form */
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-6">اطلاعات فروشگاه</h2>

              {!user && (
                <div className="alert alert-info mb-6">
                  <span>
                    برای ایجاد فروشگاه باید وارد حساب کاربری خود شوید.{' '}
                    <Link href="/auth/login?redirect=/become-a-seller" className="link">
                      ورود
                    </Link>{' '}
                    یا{' '}
                    <Link href="/auth/register?redirect=/become-a-seller" className="link">
                      ثبت‌نام
                    </Link>
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">نام فروشگاه *</legend>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="مثال: فروشگاه مد و پوشاک"
                    required
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">آدرس فروشگاه *</legend>
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="text-base-content/60 text-sm whitespace-nowrap">
                      kakamalem.com/store/
                    </span>
                    <input
                      type="text"
                      name="storeSlug"
                      value={formData.storeSlug}
                      onChange={handleChange}
                      className="input input-bordered flex-1"
                      placeholder="your-store"
                      pattern="[a-z0-9-]+"
                      required
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                    />
                  </div>
                  <p className="text-sm text-base-content/60 mt-1">
                    فقط حروف انگلیسی کوچک، اعداد و خط تیره مجاز است
                  </p>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">توضیحات فروشگاه</legend>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    placeholder="درباره فروشگاه و محصولات خود بنویسید..."
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">شماره تماس *</legend>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="+93 700 000 000"
                    required
                    dir="ltr"
                    style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                  />
                </fieldset>

                <div className="fieldset">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <span className="label-text">
                      <Link href="/terms" className="link link-primary" target="_blank">
                        قوانین و مقررات
                      </Link>{' '}
                      را مطالعه کرده و می‌پذیرم.
                    </span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="btn btn-ghost"
                    disabled={isLoading}
                  >
                    بازگشت
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !formData.agreeToTerms}
                    className="btn btn-primary flex-1 gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        در حال ایجاد...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        ایجاد فروشگاه
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
