import React from 'react'
import { CartProvider } from './cart'
import { CartMergeHandler } from './cart/CartMergeHandler'
import { WishlistProvider } from './wishlist'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <CartProvider>
      <WishlistProvider>
        <CartMergeHandler />
        {children}
      </WishlistProvider>
    </CartProvider>
  )
}

// Re-export individual providers and hooks
export { CartProvider, useCart } from './cart'
export { WishlistProvider, useWishlist } from './wishlist'
export * from './cart/shared'
