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
  ShoppingCart,
} from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { CategoryCard } from '../components/CategoryCard'
import { Category, Product } from '@/payload-types'
import { MOCK_PRODUCTS } from '@/lib/mockProducts' // <- shared mock products

interface HomeData {
  heroProducts: Product[]
  categories: Category[]
  featuredDeals: Product[]
  trendingProducts: Product[]
}

// Helper to get a usable URL from Payload's `string | Media` shape (robust at runtime)
const getMediaUrl = (media?: string | { url?: string } | any): string | undefined => {
  if (!media) return undefined
  if (typeof media === 'string') return media
  // common payload media shapes often include `url`
  return media.url ?? media.data?.url ?? undefined
}

// Mock data generator - now uses shared MOCK_PRODUCTS
const generateMockData = (): HomeData => {
  // Use the shared product list & pick subsets by index (safe if mock has >= 12 items)
  const all = MOCK_PRODUCTS ?? ([] as Product[])

  // Hero: first 2 products (fallback to first available)
  const heroProducts = all.slice(0, 2)

  // Featured deals: use products 3..6 (if fewer, fallback to whatever exists)
  const featuredDeals = all.slice(2, 6)

  // Trending: products 6..10
  const trendingProducts = all.slice(6, 10)

  // Categories are still small inline mocks (move to lib if you want)
  const categories: Category[] = [
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300',
    } as unknown as Category,
    {
      id: '2',
      name: 'Fashion',
      slug: 'fashion',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
    } as unknown as Category,
    {
      id: '3',
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300',
    } as unknown as Category,
    {
      id: '4',
      name: 'Sports',
      slug: 'sports',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300',
    } as unknown as Category,
    {
      id: '5',
      name: 'Beauty',
      slug: 'beauty',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
    } as unknown as Category,
    {
      id: '6',
      name: 'Books',
      slug: 'books',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300',
    } as unknown as Category,
  ]

  return {
    heroProducts,
    categories,
    featuredDeals,
    trendingProducts,
  }
}

export default function Homepage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)

  useEffect(() => {
    setData(generateMockData())
  }, [])

  useEffect(() => {
    if (!data?.heroProducts) return
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % data.heroProducts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [data])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  const currentHero = data.heroProducts[currentHeroIndex] ?? (data.heroProducts[0] as Product)
  const bgImageUrl = getMediaUrl(currentHero?.images?.[0]?.image) ?? ''

  return (
    <div className="min-h-screen">
      {/* Hero Banner with Product Showcase */}
      <div
        className="hero min-h-[600px] relative overflow-hidden"
        style={{
          backgroundImage: `url(${bgImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="hero-overlay bg-black/60"></div>
        <div className="hero-content text-center text-neutral-content z-10">
          <div className="max-w-2xl">
            <div className="badge badge-primary badge-lg gap-2 mb-4">
              <Sparkles className="w-4 h-4" />
              Featured Deal
            </div>
            <h1 className="mb-5 text-6xl font-bold">{currentHero?.name}</h1>
            <p className="mb-5 text-xl">{currentHero?.shortDescription}</p>
            <div className="flex items-center justify-center gap-4 mb-8">
              {currentHero?.salePrice && (
                <>
                  <span className="text-5xl font-bold text-primary">${currentHero.salePrice}</span>
                  <span className="text-3xl line-through opacity-60">${currentHero.price}</span>
                </>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  try {
                    const raw = localStorage.getItem('cart')
                    const cart = raw ? JSON.parse(raw) : []
                    const item = {
                      id: currentHero.id,
                      name: currentHero.name,
                      price: currentHero.salePrice ?? currentHero.price,
                      qty: 1,
                      image: getMediaUrl(currentHero.images?.[0]?.image) ?? '',
                      slug: currentHero.slug,
                    }
                    const existing = cart.find((c: any) => c.id === item.id)
                    if (existing) existing.qty += 1
                    else cart.push(item)
                    localStorage.setItem('cart', JSON.stringify(cart))
                  } catch (e) {
                    console.error('cart error', e)
                  }
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <a
                href={`/product/${currentHero.slug}`}
                className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary"
              >
                View Details
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {data.heroProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentHeroIndex ? 'bg-primary w-8' : 'bg-white/50'}`}
            />
          ))}
        </div>
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
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2">Shop by Category</h2>
            <p className="opacity-70">Find what you're looking for</p>
          </div>
          <a href="/shop" className="btn btn-ghost text-primary">
            View All <ChevronRight className="w-5 h-5" />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Flash Deals */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="badge badge-primary badge-lg gap-2 mb-4">
              <TrendingUp className="w-4 h-4" />
              Limited Time
            </div>
            <h2 className="text-5xl font-bold mb-4">Flash Deals</h2>
            <p className="text-xl opacity-70">Hurry! These deals won't last long</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.featuredDeals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/shop?filter=deals" className="btn btn-primary btn-lg">
              View All Deals <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2">Trending Now</h2>
              <p className="opacity-70">Popular products this week</p>
            </div>
            <a href="/shop?filter=trending" className="btn btn-ghost text-primary">
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
