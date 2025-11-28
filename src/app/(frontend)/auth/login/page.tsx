'use client'

import React, { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Logo from '../../components/Logo'
import { getRedirectUrl, safeRedirect } from '@/utilities/redirect'
import ReactIsCapsLockActive from '@matsun/reactiscapslockactive'
import { signInWithGoogle } from '../actions'
import ClearInvalidToken from '../components/ClearInvalidToken'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use custom login endpoint that supports "remember me"
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
        throw new Error(data.message || 'Login failed')
      }

      // Set flag to trigger cart merge
      sessionStorage.setItem('justLoggedIn', 'true')

      // Dispatch custom event for cart merge
      window.dispatchEvent(new Event('userLoggedIn'))

      // Get redirect URL from query params and safely redirect
      const redirectUrl = getRedirectUrl(searchParams)
      const safeUrl = safeRedirect(redirectUrl, '/')
      window.location.href = safeUrl
    } catch (err: any) {
      setError(err.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Auto-clear invalid tokens */}
      <ClearInvalidToken />

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-base-100">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-6">
            <Logo />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
            <p className="text-base-content/70">Sign in to your account to continue shopping</p>
          </div>

          {/* Error Alert (keeps semantic error) */}
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <label className="input w-full input-bordered flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-70 text-secondary" />
                <input
                  type="email"
                  className="grow"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <ReactIsCapsLockActive>
                {(active: boolean) => (
                  <>
                    <label className="input w-full input-bordered flex items-center gap-2">
                      <Lock className="w-4 h-4 opacity-70 text-secondary" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="grow"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="label-text">Remember me</span>
              </label>
              <Link href="/forgot-password" className="link link-primary text-sm">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading loading-spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-8">OR</div>

          {/* Social Login */}
          <div className="space-y-3">
            <form
              action={(formData) => {
                const redirectUrl = getRedirectUrl(searchParams)
                return signInWithGoogle(redirectUrl || undefined)
              }}
            >
              <button type="submit" className="btn btn-outline btn-block">
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
                Continue with Google
              </button>
            </form>
            {/* Apple Sign-In disabled */}
            {/* <form action={signInWithApple}>
              <button type="submit" className="btn btn-outline btn-block">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </form> */}
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-base-content/70">
            Don't have an account?{' '}
            <Link href="/auth/register" className="link link-primary font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12 text-white">
        <div className="max-w-lg text-center">
          <div className="mb-8">
            <ShoppingBag className="w-24 h-24 mx-auto mb-6 opacity-90" />
          </div>
          <h2 className="text-5xl font-bold mb-6">Shop Smarter, Live Better</h2>
          <p className="text-xl opacity-90 mb-8">
            Discover thousands of products from top brands at unbeatable prices. Your satisfaction
            is our priority.
          </p>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="opacity-80">Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="opacity-80">Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">4.9</div>
              <div className="opacity-80">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
