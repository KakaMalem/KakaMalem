import type { Product } from '@/payload-types'

export interface CartItem {
  productId: string
  quantity: number
  variantId?: string
  addedAt?: string
  product?: Product
  isInStock?: boolean
  availableQuantity?: number | null
}

export interface CartData {
  items: CartItem[]
  itemCount?: number
  subtotal?: number
  isEmpty?: boolean
}

export interface CartContextType {
  cart: CartData
  loading: boolean
  error: string | null
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>
  removeItem: (productId: string, variantId?: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  mergeCart: () => Promise<void>
}

export interface CartResponse {
  success: boolean
  message?: string
  error?: string
  data?: CartData
  warnings?: string[]
}
