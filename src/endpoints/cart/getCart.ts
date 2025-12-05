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

            // Fetch variant if specified
            let variant = null
            if (item.variantId) {
              try {
                variant = await req.payload.findByID({
                  collection: 'product-variants',
                  id: item.variantId,
                  depth: 1,
                })
              } catch (error) {
                console.error(`Variant ${item.variantId} not found:`, error)
                // Variant no longer available - item becomes invalid
                return null
              }
            }

            // Check stock availability - use variant stock if available, otherwise product stock
            const stockSource = variant || product
            let isInStock = true
            let availableQuantity = null

            if (
              stockSource.trackQuantity &&
              stockSource.quantity !== null &&
              stockSource.quantity !== undefined
            ) {
              isInStock = item.quantity <= stockSource.quantity
              availableQuantity = stockSource.quantity

              // Adjust quantity if it exceeds available stock (only if backorders not allowed)
              if (!stockSource.allowBackorders && item.quantity > stockSource.quantity) {
                item.quantity = stockSource.quantity
              }
            }

            return {
              ...item,
              product,
              variant,
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
        // Use variant price if available, otherwise product price
        let price = item.product.salePrice || item.product.price || 0
        if (item.variant && item.variant.price) {
          price = item.variant.price
        }
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
