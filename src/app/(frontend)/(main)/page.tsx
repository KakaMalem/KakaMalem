import React from 'react'
import { Category, Product } from '@/payload-types'
import HomeClient from './page.client'

interface HomeData {
  heroProducts: Product[]
  categories: Category[]
  featuredDeals: Product[]
  trendingProducts: Product[]
}

// Fetch real data from API
async function fetchHomeData(): Promise<HomeData> {
  try {
    // Fetch products with variant data - increased limit to get more featured products
    const productsRes = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/search-products?limit=50`,
      { next: { revalidate: 60 } }, // Revalidate every minute
    )
    const productsData = await productsRes.json()
    const allProducts: Product[] = productsData.products || []

    // Fetch categories with depth=2 to get the image URLs
    const categoriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/categories?limit=10&depth=2`,
      { next: { revalidate: 3600 } }, // Revalidate every hour
    )
    const categoriesData = await categoriesRes.json()
    const categories: Category[] = categoriesData.docs || []

    // Split products into different sections
    const heroProducts = allProducts.filter((p) => p.featured).slice(0, 3)
    const featuredDeals = allProducts.filter((p) => p.featured).slice(0, 8)
    const trendingProducts = allProducts
      .filter((p) => p.totalSold && p.totalSold > 0)
      .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
      .slice(0, 8)

    return {
      heroProducts: heroProducts.length > 0 ? heroProducts : allProducts.slice(0, 3),
      categories,
      featuredDeals: featuredDeals.length > 0 ? featuredDeals : allProducts.slice(0, 8),
      trendingProducts: trendingProducts.length > 0 ? trendingProducts : allProducts.slice(0, 8),
    }
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return {
      heroProducts: [],
      categories: [],
      featuredDeals: [],
      trendingProducts: [],
    }
  }
}

export default async function Homepage() {
  const data = await fetchHomeData()

  return <HomeClient data={data} />
}
