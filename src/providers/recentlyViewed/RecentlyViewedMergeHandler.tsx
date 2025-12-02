'use client'

import { useEffect, useRef } from 'react'
import { useRecentlyViewed } from './index'

/**
 * Component that handles merging guest recently viewed data with user account after login
 * Should be mounted at the app root level
 */
export const RecentlyViewedMergeHandler = () => {
  const { mergeGuestData, isAuthenticated } = useRecentlyViewed()
  const hasAttemptedMerge = useRef(false)

  useEffect(() => {
    // Only attempt merge once per session
    if (hasAttemptedMerge.current) return

    // Wait until we know auth status
    if (isAuthenticated === null) return

    // Only merge if authenticated
    if (isAuthenticated) {
      mergeGuestData()
      hasAttemptedMerge.current = true
    }
  }, [mergeGuestData, isAuthenticated])

  // This component doesn't render anything
  return null
}
