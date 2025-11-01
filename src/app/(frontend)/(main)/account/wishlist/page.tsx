'use client'

import React from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Wishlist</h2>

      <div className="card bg-base-200">
        <div className="card-body text-center py-12">
          <Heart className="w-16 h-16 mx-auto opacity-50 mb-4 text-primary" />
          <p className="text-lg opacity-70">Your wishlist is empty</p>
          <Link href="/shop" className="btn btn-primary mt-4">
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
