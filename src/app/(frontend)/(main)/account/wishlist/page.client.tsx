'use client'

import React from 'react'
import Link from 'next/link'
import { Heart, ShoppingBag } from 'lucide-react'
import { Product } from '@/payload-types'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'
import { ProductCard } from '@/app/(frontend)/components/ProductCard'

interface WishlistClientProps {
  products: Product[]
}

export default function WishlistClient({ products }: WishlistClientProps) {
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'حساب کاربری', href: '/account' },
            { label: 'لیست علاقه‌مندی‌ها', active: true },
          ]}
        />

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-error" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">لیست علاقه‌مندی‌های من</h2>
            <p className="text-base-content/70 mt-0.5">محصولات مورد علاقه شما</p>
          </div>
        </div>

        <div className="card bg-base-200 shadow-sm">
          <div className="card-body text-center py-16">
            <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-base-content/30" />
            </div>
            <h3 className="text-xl font-bold mb-2">لیست علاقه‌مندی‌های شما خالی است</h3>
            <p className="text-base-content/70 mb-6 max-w-md mx-auto">
              با کلیک بر روی آیکون قلب، محصولات مورد علاقه خود را برای بعد ذخیره کنید
            </p>
            <Link href="/" className="btn btn-primary mx-auto gap-2">
              <ShoppingBag className="w-4 h-4" />
              شروع خرید
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'حساب کاربری', href: '/account' },
          { label: 'لیست علاقه‌مندی‌ها', active: true },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-error" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">لیست علاقه‌مندی‌های من</h2>
            <p className="text-base-content/70 mt-0.5">{products.length} محصول ذخیره شده</p>
          </div>
        </div>
        <Link href="/" className="btn btn-outline gap-2">
          <ShoppingBag className="w-4 h-4" />
          ادامه خرید
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
