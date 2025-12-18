'use client'

import { useEffect } from 'react'

/**
 * Clears authentication cookies when OAuth errors occur
 * This prevents invalid tokens from blocking future login attempts
 */
export default function ClearInvalidToken() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hasError = params.has('error')

    if (hasError) {
      fetch('/api/logout', { method: 'POST' })
        .then(() => console.log('Cleared invalid auth cookies due to OAuth error'))
        .catch((err) => console.error('Failed to clear cookies:', err))
    }
  }, [])

  return null
}
