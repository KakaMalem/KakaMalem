import type { PayloadRequest, Endpoint } from 'payload'
import { getGuestCart } from '../../utilities/cartUtils'
import type { CartItem, CartData, PopulatedCartItem } from './types'

export const getCart: Endpoint = {
  path: '/cart',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    try {
      const user = req.user
      let cart: CartData = { items: [] }

      // Get cart based on authentication status
      if (user && user.cart) {
        cart = user.cart as unknown as CartData
      } else if (!user) {
        cart = await getGuestCart(req)
      }

      // Populate and validate cart items
      const populatedItems = await Promise.all(
        (cart.items || []).map(async (item: CartItem) => {
          try {
            const product = await req.payload.findByID({
              collection: 'products',
              id: item.productId,
              depth: 1,
            })

            // Check if product is still available
            if (!product || (product._status && product._status !== 'published')) {
              return null // Product no longer available
            }

            // Check stock availability
            let isInStock = true
            let availableQuantity = null

            if (product.trackQuantity) {
              isInStock = item.quantity <= product.quantity
              availableQuantity = product.quantity

              // Adjust quantity if it exceeds available stock (only if backorders not allowed)
              if (!product.allowBackorders && item.quantity > product.quantity) {
                item.quantity = product.quantity
              }
            }

            return {
              ...item,
              product,
              isInStock,
              availableQuantity,
            }
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error)
            return null // Product not found or error
          }
        }),
      )

      // Filter out null items (deleted/unavailable products)
      const validItems = populatedItems.filter((item): item is PopulatedCartItem => item !== null)

      // Calculate totals
      const subtotal = validItems.reduce((sum: number, item: PopulatedCartItem) => {
        const price = item.product.salePrice || item.product.price || 0
        return sum + price * item.quantity
      }, 0)

      const itemCount = validItems.reduce(
        (sum: number, item: PopulatedCartItem) => sum + item.quantity,
        0,
      )

      return Response.json(
        {
          success: true,
          data: {
            items: validItems,
            itemCount,
            subtotal,
            isEmpty: validItems.length === 0,
          },
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Error fetching cart:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch cart',
        },
        { status: 500 },
      )
    }
  },
}
