import type { Product, ProductVariant } from '@/payload-types'

export interface CartItem {
  productId: string
  quantity: number
  variantId?: string
  addedAt?: string
  product?: Product // Populated product data
  variant?: ProductVariant | null // Populated variant data
}

export interface PopulatedCartItem extends CartItem {
  product: Product
  variant: ProductVariant | null
  isInStock: boolean
  availableQuantity: number | null
}

export interface CartData {
  items: CartItem[]
}
