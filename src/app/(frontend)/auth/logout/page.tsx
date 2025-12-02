'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/providers'

export default function LogoutPage() {
  const router = useRouter()
  const { refreshCart } = useCart()
  const [status, setStatus] = useState<'logging-out' | 'success' | 'error'>('logging-out')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const performLogout = async () => {
      try {
        const response = await fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include',
        })

        if (response.ok) {
          // Clear any session storage flags
          sessionStorage.removeItem('justLoggedIn')

          // Refresh cart to get new empty guest cart
          await refreshCart()

          // Dispatch event to notify other components
          window.dispatchEvent(new Event('userLoggedOut'))

          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Logout error:', error)
        setStatus('error')
      }
    }

    performLogout()
  }, [refreshCart])

  // Separate useEffect for countdown and redirect
  useEffect(() => {
    if (status !== 'success') return

    if (countdown <= 0) {
      router.push('/')
      router.refresh()
      return
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [status, countdown, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="max-w-md w-full">
        <div className="bg-base-100 rounded-lg shadow-xl p-8 text-center">
          {status === 'logging-out' && (
            <>
              <div className="flex justify-center mb-6">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Signing you out...</h1>
              <p className="text-base-content/70">Please wait a moment</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <svg
                  className="w-16 h-16 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Successfully signed out</h1>
              <p className="text-base-content/70 mb-6">
                Redirecting you to the home page in {countdown} second{countdown !== 1 ? 's' : ''}
                ...
              </p>
              <Link href="/" className="btn btn-primary">
                Go to Home Now
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <svg
                  className="w-16 h-16 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-base-content/70 mb-6">
                We couldn&apos;t sign you out. Please try again.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                  Try Again
                </button>
                <Link href="/" className="btn btn-ghost">
                  Go to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
