'use client'

import React, { useState, useMemo } from 'react'
import { Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CapsLockDetector } from '../../components/CapsLockDetector'
import { signInWithGoogle } from '../actions'
import { getRedirectUrl } from '@/utilities/redirect'
import Logo from '../../components/Logo'

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  terms?: string
}

interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Calculate password strength
  const passwordStrength = useMemo((): PasswordStrength => {
    const password = formData.password
    if (!password) return { score: 0, label: '', color: '' }

    let score = 0

    // Length check
    if (password.length >= 8) score++
    if (password.length >= 12) score++

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    // Cap at 4
    score = Math.min(score, 4)

    const labels = ['خیلی ضعیف', 'ضعیف', 'متوسط', 'قوی', 'خیلی قوی']
    const colors = ['bg-error', 'bg-warning', 'bg-warning', 'bg-success', 'bg-success']

    return {
      score,
      label: labels[score] || '',
      color: colors[score] || '',
    }
  }, [formData.password])

  // Real-time field validation
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'نام الزامی است'
        if (value.trim().length < 2) return 'نام باید حداقل ۲ کاراکتر باشد'
        break
      case 'lastName':
        if (!value.trim()) return 'تخلص الزامی است'
        if (value.trim().length < 2) return 'تخلص باید حداقل ۲ کاراکتر باشد'
        break
      case 'email':
        if (!value.trim()) return 'ایمیل الزامی است'
        if (!validateEmail(value)) return 'فرمت ایمیل نامعتبر است'
        break
      case 'phone':
        if (!value.trim()) return 'شماره تماس الزامی است'
        if (!/^[0-9+\-\s()]*$/.test(value)) return 'فرمت شماره تماس نامعتبر است'
        break
      case 'password':
        if (!value) return 'رمز عبور الزامی است'
        if (value.length < 8) return 'رمز عبور باید حداقل ۸ کاراکتر باشد'
        break
      case 'confirmPassword':
        if (!value) return 'تکرار رمز عبور الزامی است'
        if (value !== formData.password) return 'رمز عبور و تکرار آن یکسان نیستند'
        break
    }
    return undefined
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const errors: FormErrors = {}

    const firstNameError = validateField('firstName', formData.firstName)
    if (firstNameError) errors.firstName = firstNameError

    const lastNameError = validateField('lastName', formData.lastName)
    if (lastNameError) errors.lastName = lastNameError

    const emailError = validateField('email', formData.email)
    if (emailError) errors.email = emailError

    const phoneError = validateField('phone', formData.phone)
    if (phoneError) errors.phone = phoneError

    const passwordError = validateField('password', formData.password)
    if (passwordError) errors.password = passwordError

    const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

    if (!acceptTerms) {
      errors.terms = 'لطفاً شرایط و قوانین را بپذیرید'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear field error when user types
    if (fieldErrors[name as keyof FormErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }

    // Validate on change if field was touched
    if (touchedFields.has(name)) {
      const fieldError = validateField(name, value)
      if (fieldError) {
        setFieldErrors((prev) => ({ ...prev, [name]: fieldError }))
      }
    }

    // Special case: revalidate confirmPassword when password changes
    if (name === 'password' && touchedFields.has('confirmPassword') && formData.confirmPassword) {
      const confirmError =
        value !== formData.confirmPassword ? 'رمز عبور و تکرار آن یکسان نیستند' : undefined
      setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const handleBlur = (name: string) => {
    setTouchedFields((prev) => new Set(prev).add(name))
    const value = formData[name as keyof typeof formData]
    const fieldError = validateField(name, value)
    if (fieldError) {
      setFieldErrors((prev) => ({ ...prev, [name]: fieldError }))
    }
  }

  const handleTermsChange = (checked: boolean) => {
    setAcceptTerms(checked)
    if (fieldErrors.terms) {
      setFieldErrors((prev) => ({ ...prev, terms: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Call the custom register endpoint
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        switch (response.status) {
          case 409:
            // Email already exists - show on email field
            setFieldErrors((prev) => ({
              ...prev,
              email: 'این ایمیل قبلاً ثبت شده است',
            }))
            break
          case 400:
            // Validation error - show toast
            toast.error(data.error || data.details || 'اطلاعات وارد شده نامعتبر است')
            break
          default:
            toast.error(data.error || 'ثبت‌نام ناموفق بود')
        }
        setLoading(false)
        return
      }

      // Registration successful, now login automatically
      try {
        // Call custom login endpoint
        const loginResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            stayLoggedIn: false, // Default session for auto-login
          }),
        })

        const loginData = await loginResponse.json()

        if (loginResponse.ok && loginData.user) {
          // Get redirect URL from query params
          const redirectUrl = getRedirectUrl(searchParams) || '/'

          // Redirect to success page
          const successUrl = `/auth/success?type=register&name=${encodeURIComponent(formData.firstName)}&redirect=${encodeURIComponent(redirectUrl)}`
          window.location.href = successUrl
        } else {
          // Login failed, redirect to login page
          toast.success('حساب کاربری ایجاد شد! لطفاً وارد شوید.')
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 1500)
        }
      } catch (loginError) {
        console.error('Auto-login failed:', loginError)
        // Login failed, redirect to login page
        toast.success('حساب کاربری ایجاد شد! لطفاً وارد شوید.')
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 1500)
      }
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        toast.error('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.')
      } else {
        toast.error('خطایی در ثبت‌نام رخ داد')
      }
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
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-md bg-base-100/70 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-base-300/50 border border-base-100/80">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>

          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-base-content mb-2">ایجاد حساب کاربری</h1>
            <p className="text-base-content/70">به کاکا معلم خوش آمدید</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="fieldset">
                <label className="label">
                  <span className="label-text font-medium">نام</span>
                </label>
                <label
                  className={`input flex items-center gap-2 ${fieldErrors.firstName ? 'input-error' : ''}`}
                >
                  <User
                    className={`w-4 h-4 opacity-70 ${fieldErrors.firstName ? 'text-error' : 'text-secondary'}`}
                  />
                  <input
                    type="text"
                    name="firstName"
                    className="grow"
                    placeholder="مطیع"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName')}
                    required
                  />
                </label>
                {fieldErrors.firstName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{fieldErrors.firstName}</span>
                  </label>
                )}
              </div>

              <div className="fieldset">
                <label className="label">
                  <span className="label-text font-medium">تخلص</span>
                </label>
                <label
                  className={`input flex items-center gap-2 ${fieldErrors.lastName ? 'input-error' : ''}`}
                >
                  <User
                    className={`w-4 h-4 opacity-70 ${fieldErrors.lastName ? 'text-error' : 'text-secondary'}`}
                  />
                  <input
                    type="text"
                    name="lastName"
                    className="grow"
                    placeholder="احمدی"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('lastName')}
                    required
                  />
                </label>
                {fieldErrors.lastName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{fieldErrors.lastName}</span>
                  </label>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="fieldset">
              <label className="label">
                <span className="label-text font-medium">آدرس ایمیل</span>
              </label>
              <label
                className={`input flex items-center gap-2 w-full ${fieldErrors.email ? 'input-error' : ''}`}
              >
                <Mail
                  className={`w-4 h-4 opacity-70 ${fieldErrors.email ? 'text-error' : 'text-secondary'}`}
                />
                <input
                  type="email"
                  name="email"
                  className="grow"
                  placeholder="your-email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
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

            {/* Phone */}
            <div className="fieldset">
              <label className="label">
                <span className="label-text font-medium">شماره تماس</span>
              </label>
              <label
                className={`input flex items-center gap-2 w-full ${fieldErrors.phone ? 'input-error' : ''}`}
              >
                <Phone
                  className={`w-4 h-4 opacity-70 ${fieldErrors.phone ? 'text-error' : 'text-secondary'}`}
                />
                <input
                  type="tel"
                  name="phone"
                  className="grow"
                  placeholder="0712345678"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                  required
                />
              </label>
              {fieldErrors.phone && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.phone}</span>
                </label>
              )}
            </div>

            <CapsLockDetector>
              {(active) => (
                <>
                  {/* Password */}
                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">رمز عبور</span>
                    </label>
                    <label
                      className={`input flex items-center gap-2 w-full ${fieldErrors.password ? 'input-error' : ''}`}
                    >
                      <Lock
                        className={`w-4 h-4 opacity-70 ${fieldErrors.password ? 'text-error' : 'text-secondary'}`}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="grow"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur('password')}
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

                    {/* Password strength indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < passwordStrength.score ? passwordStrength.color : 'bg-base-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-base-content/70">
                            {passwordStrength.label}
                          </span>
                          {passwordStrength.score >= 3 && (
                            <span className="text-xs text-success flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              رمز عبور مناسب
                            </span>
                          )}
                        </div>
                      </div>
                    )}

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
                  </div>

                  {/* Confirm Password */}
                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">تکرار رمز عبور</span>
                    </label>
                    <label
                      className={`input flex items-center gap-2 w-full ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                    >
                      <Lock
                        className={`w-4 h-4 opacity-70 ${fieldErrors.confirmPassword ? 'text-error' : 'text-secondary'}`}
                      />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className="grow"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur('confirmPassword')}
                        required
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

                    {/* Password match indicator */}
                    {formData.confirmPassword && !fieldErrors.confirmPassword && (
                      <label className="label">
                        <span className="label-text-alt text-success flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          رمز عبور مطابقت دارد
                        </span>
                      </label>
                    )}

                    {(fieldErrors.confirmPassword || active) && (
                      <label className="label">
                        {fieldErrors.confirmPassword && (
                          <span className="label-text-alt text-error">
                            {fieldErrors.confirmPassword}
                          </span>
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
                  </div>
                </>
              )}
            </CapsLockDetector>

            {/* Terms & Conditions */}
            <div className="fieldset">
              <label className="cursor-pointer flex items-start gap-3">
                <input
                  type="checkbox"
                  className={`checkbox flex-shrink-0 mt-1 ${fieldErrors.terms ? 'checkbox-error' : 'checkbox-primary'}`}
                  checked={acceptTerms}
                  onChange={(e) => handleTermsChange(e.target.checked)}
                  required
                />
                <span
                  className={`label-text text-sm leading-relaxed ${fieldErrors.terms ? 'text-error' : ''}`}
                >
                  من با{' '}
                  <Link href="/terms" className="link link-primary">
                    شرایط و قوانین
                  </Link>{' '}
                  و{' '}
                  <Link href="/privacy" className="link link-primary">
                    سیاست حفظ حریم خصوصی
                  </Link>{' '}
                  موافق هستم.
                </span>
              </label>
              {fieldErrors.terms && (
                <label className="label">
                  <span className="label-text-alt text-error">{fieldErrors.terms}</span>
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner" />
                  در حال ایجاد حساب کاربری...
                </>
              ) : (
                'ایجاد حساب کاربری'
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

          {/* Sign In Link */}
          <p className="text-center mt-6 text-base-content/80">
            قبلاً حساب کاربری دارید؟{' '}
            <Link
              href={
                searchParams.get('redirect')
                  ? `/auth/login?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
                  : '/auth/login'
              }
              className="text-primary font-semibold hover:underline"
            >
              ورود
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
