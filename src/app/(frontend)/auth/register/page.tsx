'use client'

import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ShoppingBag, User, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import Link from 'next/link'
import ReactIsCapsLockActive from '@matsun/reactiscapslockactive'

export default function RegisterPage() {
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
  const [error, setError] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      setLoading(false)
      return
    }

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
          phone: formData.phone || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Registration failed')
      }

      // Registration successful, now login automatically
      toast.success('Account created successfully! Logging you in...')

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
          toast.success('Logged in successfully! Redirecting...')

          // Small delay to show the toast before redirecting
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        } else {
          // Login failed, redirect to login page
          toast.success('Account created! Please log in.')
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 1500)
        }
      } catch (loginError) {
        console.error('Auto-login failed:', loginError)
        // Login failed, redirect to login page
        toast.success('Account created! Please log in.')
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration')
      toast.error(err.message || 'Registration failed')
      setLoading(false)
    }
  }

  const handleSocialRegister = (provider: string) => {
    // Implement OAuth flow
    console.log(`Register with ${provider}`)
  }

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-right" />
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-base-100 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Kaka Malem</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Create Account</h1>
            <p className="text-base-content/70">Join us and start shopping today</p>
          </div>

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
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">First Name</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <User className="w-4 h-4 opacity-70 text-secondary" />
                  <input
                    type="text"
                    name="firstName"
                    className="grow"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Last Name</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <User className="w-4 h-4 opacity-70 text-secondary" />
                  <input
                    type="text"
                    name="lastName"
                    className="grow"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <label className="input input-bordered flex items-center gap-2 w-full">
                <Mail className="w-4 h-4 opacity-70 text-secondary" />
                <input
                  type="email"
                  name="email"
                  className="grow"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            {/* Phone */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Phone Number</span>
                <span className="label-text-alt opacity-70">Optional</span>
              </label>
              <label className="input input-bordered flex items-center gap-2 w-full">
                <Phone className="w-4 h-4 opacity-70 text-secondary" />
                <input
                  type="tel"
                  name="phone"
                  className="grow"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </label>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <ReactIsCapsLockActive>
                {(active) => (
                  <>
                    <label className="input input-bordered flex items-center gap-2 w-full">
                      <Lock className="w-4 h-4 opacity-70 text-secondary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className="grow"
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
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
                    <label className="label">
                      <span className="label-text-alt opacity-70">
                        Must be at least 8 characters
                      </span>
                      {active && (
                        <span className="label-text-alt text-warning flex items-center gap-1">
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
                          Caps Lock is on
                        </span>
                      )}
                    </label>
                  </>
                )}
              </ReactIsCapsLockActive>
            </div>

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Confirm Password</span>
              </label>
              <ReactIsCapsLockActive>
                {(active) => (
                  <>
                    <label className="input input-bordered flex items-center gap-2 w-full">
                      <Lock className="w-4 h-4 opacity-70 text-secondary" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className="grow"
                        placeholder="Re-enter password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
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
                    {active && (
                      <label className="label">
                        <span className="label-text-alt text-warning flex items-center gap-1">
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
                          Caps Lock is on
                        </span>
                      </label>
                    )}
                  </>
                )}
              </ReactIsCapsLockActive>
            </div>

            {/* Terms & Conditions */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                />
                <span className="label-text">
                  I agree to the{' '}
                  <Link href="/terms" className="link link-primary">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="link link-primary">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-6">OR</div>

          {/* Social Login */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocialRegister('google')}
              className="btn btn-outline btn-block"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
            <button
              onClick={() => handleSocialRegister('apple')}
              className="btn btn-outline btn-block"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Sign up with Apple
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-base-content/70">
            Already have an account?{' '}
            <Link href="/auth/login" className="link link-primary font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12 text-white">
        <div className="max-w-lg">
          <div className="mb-8">
            <ShoppingBag className="w-24 h-24 mb-6 opacity-90" />
          </div>
          <h2 className="text-5xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl opacity-90 mb-12">
            Create an account to unlock exclusive deals, track your orders, and enjoy a personalized
            shopping experience.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Exclusive Deals</h3>
                <p className="opacity-80">
                  Get access to member-only discounts and early sale access
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Fast Checkout</h3>
                <p className="opacity-80">Save your information for quick and easy purchases</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Order Tracking</h3>
                <p className="opacity-80">
                  Monitor your orders in real-time from purchase to delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
