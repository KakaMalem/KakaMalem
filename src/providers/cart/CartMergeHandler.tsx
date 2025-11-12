'use client'

import { useMergeCartOnLogin } from '@/hooks/useMergeCartOnLogin'

/**
 * Component that handles automatic cart merging after login
 * Must be rendered within CartProvider
 */
export function CartMergeHandler() {
  useMergeCartOnLogin()
  return null
}
