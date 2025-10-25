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
import { ProductCard } from './components/ProductCard'
import { CategoryCard } from './components/CategoryCard'
import { Category, Product } from '@/payload-types'

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

// Mock data generator - Replace with actual Payload API calls
const generateMockData = (): HomeData => ({
  heroProducts: [
    {
      id: '1',
      name: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      price: 299,
      salePrice: 249,
      currency: 'USD',
      images: [
        {
          alt: 'Headphones',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        },
      ],
      shortDescription: 'Crystal clear sound with active noise cancellation',
    } as unknown as Product,
    {
      id: '2',
      name: 'Smart Watch Pro',
      slug: 'smart-watch-pro',
      price: 399,
      currency: 'USD',
      images: [
        {
          alt: 'Smart Watch',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        },
      ],
      shortDescription: 'Track your fitness and stay connected',
    } as unknown as Product,
  ],
  categories: [
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
  ],
  featuredDeals: [
    {
      id: '3',
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24',
      price: 1299,
      salePrice: 1199,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 342,
      images: [
        {
          alt: 'Samsung',
          image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
        },
      ],
      shortDescription: 'Latest flagship smartphone',
    } as unknown as Product,
    {
      id: '4',
      name: 'Nike Air Max 270',
      slug: 'nike-air-max',
      price: 159,
      salePrice: 129,
      currency: 'USD',
      averageRating: 4.7,
      reviewCount: 678,
      images: [
        {
          alt: 'Nike',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
        },
      ],
      shortDescription: 'Ultimate comfort and style',
    } as unknown as Product,
    {
      id: '5',
      name: 'KitchenAid Mixer',
      slug: 'kitchenaid-mixer',
      price: 449,
      salePrice: 349,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 892,
      images: [
        {
          alt: 'Mixer',
          image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400',
        },
      ],
      shortDescription: 'Professional kitchen appliance',
    } as unknown as Product,
    {
      id: '6',
      name: 'Dyson V15 Vacuum',
      slug: 'dyson-vacuum',
      price: 649,
      salePrice: 549,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 423,
      images: [
        {
          alt: 'Dyson',
          image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
        },
      ],
      shortDescription: 'Laser dust detection',
    } as unknown as Product,
  ],
  trendingProducts: [
    {
      id: '7',
      name: 'Apple AirPods Pro',
      slug: 'airpods-pro',
      price: 249,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 1234,
      images: [
        {
          alt: 'AirPods',
          image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
        },
      ],
    } as unknown as Product,
    {
      id: '8',
      name: "Levi's 501 Jeans",
      slug: 'levis-jeans',
      price: 89,
      salePrice: 69,
      currency: 'USD',
      averageRating: 4.6,
      reviewCount: 567,
      images: [
        {
          alt: 'Jeans',
          image:
            'https://plus.unsplash.com/premium_photo-1674828601017-2b8d4ea90aca?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=732',
        },
      ],
    } as unknown as Product,
    {
      id: '9',
      name: 'Instant Pot Duo',
      slug: 'instant-pot',
      price: 119,
      salePrice: 89,
      currency: 'USD',
      averageRating: 4.9,
      reviewCount: 2341,
      images: [
        {
          alt: 'Instant Pot',
          image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400',
        },
      ],
    } as unknown as Product,
    {
      id: '10',
      name: 'Canon EOS R6',
      slug: 'canon-eos-r6',
      price: 2499,
      currency: 'USD',
      averageRating: 4.8,
      reviewCount: 189,
      images: [
        {
          alt: 'Camera',
          image:
            'https://images.unsplash.com/photo-1599664223843-9349c75196bc?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470',
        },
      ],
    } as unknown as Product,
  ],
})

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

  const currentHero = data.heroProducts[currentHeroIndex]
  const bgImageUrl = getMediaUrl(currentHero.images?.[0]?.image) ?? ''

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
            <h1 className="mb-5 text-6xl font-bold">{currentHero.name}</h1>
            <p className="mb-5 text-xl">{currentHero.shortDescription}</p>
            <div className="flex items-center justify-center gap-4 mb-8">
              {currentHero.salePrice && (
                <>
                  <span className="text-5xl font-bold text-primary">${currentHero.salePrice}</span>
                  <span className="text-3xl line-through opacity-60">${currentHero.price}</span>
                </>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-primary btn-lg">
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                View Details
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {data.heroProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentHeroIndex ? 'bg-primary w-8' : 'bg-white/50'
              }`}
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
