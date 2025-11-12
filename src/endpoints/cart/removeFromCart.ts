import type { PayloadRequest, Endpoint } from 'payload'
import { getGuestCart, saveGuestCart, createCartResponse } from '../../utilities/cartUtils'
import type { CartItem, CartData } from './types'

export const removeFromCart: Endpoint = {
  path: '/cart/remove',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const body = await req.json?.()
      const { productId, variantId } = body || {}

      // Validation
      if (!productId || typeof productId !== 'string') {
        return Response.json(
          {
            success: false,
            error: 'Valid product ID is required',
          },
          { status: 400 },
        )
      }

      // Get current cart
      const user = req.user
      let currentCart: CartData = { items: [] }

      if (user && user.cart) {
        currentCart = user.cart as unknown as CartData
      }

      if (!user) {
        currentCart = await getGuestCart(req)
      }

      const items: CartItem[] = currentCart.items || []

      // Find and remove the item
      const updatedItems = items.filter(
        (item: CartItem) =>
          !(
            item.productId === productId &&
            (variantId ? item.variantId === variantId : !item.variantId)
          ),
      )

      // Check if any item was actually removed
      if (updatedItems.length === items.length) {
        return Response.json(
          {
            success: false,
            error: 'Item not found in cart',
          },
          { status: 404 },
        )
      }

      // Save cart
      if (user) {
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: {
            cart: { items: updatedItems },
          },
        })
        // Clear guest cart cookie for authenticated users
        await saveGuestCart(req, { items: [] })
      } else {
        await saveGuestCart(req, { items: updatedItems })
      }

      return createCartResponse(
        {
          success: true,
          message: 'Item removed from cart',
          data: {
            itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            items: updatedItems,
          },
        },
        200,
        req,
      )
    } catch (error) {
      console.error('Error removing from cart:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to remove item from cart',
        },
        { status: 500 },
      )
    }
  },
}
