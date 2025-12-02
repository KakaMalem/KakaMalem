import type { Product } from '@/payload-types'

export interface CartItem {
  productId: string
  quantity: number
  variantId?: string
  addedAt?: string
  product?: Product // Populated product data
}

export interface PopulatedCartItem extends CartItem {
  product: Product
  isInStock: boolean
  availableQuantity: number | null
}

export interface CartData {
  items: CartItem[]
}
