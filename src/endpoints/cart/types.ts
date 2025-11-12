import type { Product } from '@/payload-types'

export interface CartItem {
  productId: string
  quantity: number
  variantId?: string
  addedAt?: string
  product?: Product // Populated product data
}

export interface CartData {
  items: CartItem[]
}
