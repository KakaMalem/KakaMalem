'use client'

import { useEffect, useRef } from 'react'
import { useCart } from '@/providers'

/**
 * Hook to automatically merge guest cart with user cart after login
 * Should be used in the root layout or a component that's always mounted
 */
export function useMergeCartOnLogin() {
  const { mergeCart } = useCart()
  const hasMergedRef = useRef(false)

  useEffect(() => {
    const handleAuthChange = async () => {
      // Check if user just logged in
      const justLoggedIn = sessionStorage.getItem('justLoggedIn')

      if (justLoggedIn && !hasMergedRef.current) {
        hasMergedRef.current = true
        sessionStorage.removeItem('justLoggedIn')

        try {
          console.log('🔄 Merging guest cart with user cart...')
          await mergeCart()
          console.log('✅ Cart merged successfully')
        } catch (error) {
          console.error('❌ Failed to merge cart:', error)
          hasMergedRef.current = false // Allow retry
        }
      }
    }

    // Run on mount
    handleAuthChange()

    // Listen for storage events (login from another tab)
    window.addEventListener('storage', handleAuthChange)

    // Listen for custom auth events
    window.addEventListener('userLoggedIn', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('userLoggedIn', handleAuthChange)
    }
  }, [mergeCart])
}
