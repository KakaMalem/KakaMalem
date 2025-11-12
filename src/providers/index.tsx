import React from 'react'
import { CartProvider } from './cart'
import { CartMergeHandler } from './cart/CartMergeHandler'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <CartProvider>
      <CartMergeHandler />
      {children}
    </CartProvider>
  )
}

// Re-export individual providers and hooks
export { CartProvider, useCart } from './cart'
export * from './cart/shared'
