'use client'

import { useEffect, useState } from 'react'

export default function ClearInvalidToken() {
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    // Check if there's an error in the URL
    const params = new URLSearchParams(window.location.search)
    const hasError = params.has('error')

    // If there's an error or we detect issues, clear cookies
    if (hasError || document.cookie.includes('payload-token')) {
      fetch('/api/logout', { method: 'POST' })
        .then(() => {
          console.log('🧹 Cleared any invalid auth cookies')
          setCleared(true)
        })
        .catch((err) => console.error('Failed to clear cookies:', err))
    }
  }, [])

  return null // This component doesn't render anything
}
