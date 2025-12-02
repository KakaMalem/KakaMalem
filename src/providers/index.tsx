import React from 'react'
import { CartProvider } from './cart'
import { CartMergeHandler } from './cart/CartMergeHandler'
import { WishlistProvider } from './wishlist'
import { RecentlyViewedProvider } from './recentlyViewed'
import { RecentlyViewedMergeHandler } from './recentlyViewed/RecentlyViewedMergeHandler'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <CartProvider>
      <WishlistProvider>
        <RecentlyViewedProvider>
          <CartMergeHandler />
          <RecentlyViewedMergeHandler />
          {children}
        </RecentlyViewedProvider>
      </WishlistProvider>
    </CartProvider>
  )
}

// Re-export individual providers and hooks
export { CartProvider, useCart } from './cart'
export { WishlistProvider, useWishlist } from './wishlist'
export { RecentlyViewedProvider, useRecentlyViewed } from './recentlyViewed'
export * from './cart/shared'
