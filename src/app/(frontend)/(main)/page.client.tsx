'use client'

import React, { useState, useEffect } from 'react'
import {
  Truck,
  ShieldCheck,
  Package,
  TrendingUp,
  Sparkles,
  Gift,
  Tag,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { CategoryCard } from '../components/CategoryCard'
import { Category, Product } from '@/payload-types'
import { useCart } from '@/providers/cart'

interface HomeData {
  heroProducts: Product[]
  categories: Category[]
  featuredDeals: Product[]
  trendingProducts: Product[]
}

interface HomeClientProps {
  data: HomeData
}

export default function HomeClient({ data }: HomeClientProps) {
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const { addItem, loading: cartLoading } = useCart()

  useEffect(() => {
    if (!data?.heroProducts || data.heroProducts.length === 0) return
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % data.heroProducts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [data])

  // Show empty state if no products at all
  const hasProducts =
    data.heroProducts.length > 0 ||
    data.featuredDeals.length > 0 ||
    data.trendingProducts.length > 0

  if (!hasProducts && data.categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package className="w-24 h-24 mx-auto text-base-content/30 mb-4" />
          <h2 className="text-3xl font-bold mb-2">No Products Yet</h2>
          <p className="text-base-content/70 mb-6">
            Our store is being set up. Check back soon for amazing products!
          </p>
          <a href="/shop" className="btn btn-primary">
            Go to Shop
          </a>
        </div>
      </div>
    )
  }

  const currentHero = data.heroProducts[currentHeroIndex] ?? data.heroProducts[0]

  // Get hero background image URL
  let bgImageUrl = ''
  if (currentHero?.images) {
    const firstImage = Array.isArray(currentHero.images)
      ? currentHero.images[0]
      : currentHero.images

    if (typeof firstImage === 'string') {
      bgImageUrl = firstImage
    } else if (typeof firstImage === 'object' && firstImage?.url) {
      bgImageUrl = firstImage.url
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Product Showcase */}
      <div
        className="hero min-h-[600px] relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20"
        style={
          bgImageUrl
            ? {
                backgroundImage: `url(${bgImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <div className="hero-overlay bg-black/60"></div>
        <div className="hero-content text-center text-neutral-content z-10">
          <div className="max-w-2xl">
            <div className="badge badge-primary badge-lg gap-2 mb-4">
              <Sparkles className="w-4 h-4" />
              Featured Deal
            </div>
            <h1 className="mb-5 text-5xl md:text-6xl font-bold drop-shadow-lg">
              {currentHero?.name || 'Welcome to Our Store'}
            </h1>
            <p className="mb-5 text-lg md:text-xl">
              {currentHero?.shortDescription || 'Discover amazing products at great prices'}
            </p>
            <div className="flex items-center justify-center gap-4 mb-8">
              {currentHero?.salePrice ? (
                <>
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    {currentHero.currency || 'USD'} {currentHero.salePrice}
                  </span>
                  <span className="text-2xl md:text-3xl line-through opacity-60">
                    {currentHero.currency || 'USD'} {currentHero.price}
                  </span>
                </>
              ) : currentHero?.price ? (
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  {currentHero.currency || 'USD'} {currentHero.price}
                </span>
              ) : null}
            </div>
            {currentHero && (
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={async () => {
                    try {
                      await addItem(currentHero.id, 1)
                    } catch (e) {
                      console.error('Error adding to cart:', e)
                    }
                  }}
                  disabled={cartLoading}
                >
                  {cartLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Add to Cart'
                  )}
                </button>
                <a
                  href={`/shop/${currentHero.slug}`}
                  className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary"
                >
                  View Details
                </a>
              </div>
            )}
          </div>
        </div>
        {data.heroProducts.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {data.heroProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentHeroIndex ? 'bg-primary w-8' : 'bg-white/50'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats / Promo Banner */}
      <div className="bg-base-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <Truck className="w-8 h-8 text-primary" />
              <div className="text-left">
                <div className="font-bold">Free Shipping</div>
                <div className="text-sm opacity-70">Orders over $50</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" />
              <div className="text-left">
                <div className="font-bold">Secure Payment</div>
                <div className="text-sm opacity-70">100% protected</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div className="text-left">
                <div className="font-bold">Easy Returns</div>
                <div className="text-sm opacity-70">30-day policy</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Gift className="w-8 h-8 text-primary" />
              <div className="text-left">
                <div className="font-bold">Gift Cards</div>
                <div className="text-sm opacity-70">Available now</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shop by Category */}
      {data.categories.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Shop by Category</h2>
              <p className="opacity-70">Find what you're looking for</p>
            </div>
            <a href="/shop" className="btn btn-ghost text-primary">
              View All <ChevronRight className="w-5 h-5" />
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.categories.slice(0, 6).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      )}

      {/* Flash Deals */}
      {data.featuredDeals.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="badge badge-primary badge-lg gap-2 mb-4">
                <TrendingUp className="w-4 h-4" />
                Limited Time
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Flash Deals</h2>
              <p className="text-lg md:text-xl opacity-70">Hurry! These deals won't last long</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.featuredDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-8">
              <a href="/shop" className="btn btn-primary btn-lg">
                View All Products <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      {data.trendingProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Trending Now</h2>
                <p className="opacity-70">Popular products this week</p>
              </div>
              <a href="/shop" className="btn btn-ghost text-primary">
                View All <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} size="compact" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter / CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <Tag className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl font-bold mb-4">Get Exclusive Deals</h2>
          <p className="text-xl mb-8 opacity-90">
            Subscribe to our newsletter and get 10% off your first order
          </p>
          <div className="join max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="input input-bordered join-item w-full text-base-content"
            />
            <button className="btn btn-neutral join-item">Subscribe</button>
          </div>
        </div>
      </section>
    </div>
  )
}
