import type { PayloadRequest, Endpoint } from 'payload'
import { getGuestCart, saveGuestCart, createCartResponse } from '../../utilities/cartUtils'
import type { CartItem, CartData } from './types'

export const updateCart: Endpoint = {
  path: '/cart/update',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const body = await req.json?.()
      const { productId, quantity, variantId } = body || {}

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

      if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
        return Response.json(
          {
            success: false,
            error: 'Quantity must be a non-negative integer',
          },
          { status: 400 },
        )
      }

      if (quantity > 100) {
        return Response.json(
          {
            success: false,
            error: 'Maximum quantity per item is 100',
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

      // Find the item to update
      const existingItemIndex = items.findIndex(
        (item: CartItem) =>
          item.productId === productId &&
          (variantId ? item.variantId === variantId : !item.variantId),
      )

      if (existingItemIndex === -1) {
        return Response.json(
          {
            success: false,
            error: 'Item not found in cart',
          },
          { status: 404 },
        )
      }

      let updatedItems: CartItem[]

      if (quantity === 0) {
        // Remove item from cart
        updatedItems = items.filter((_, index) => index !== existingItemIndex)
      } else {
        // Verify stock availability if updating to higher quantity
        try {
          const product = await req.payload.findByID({
            collection: 'products',
            id: productId,
          })

          if (!product || product.status !== 'published') {
            return Response.json(
              {
                success: false,
                error: 'Product is no longer available',
              },
              { status: 400 },
            )
          }

          if (product.trackQuantity && !product.allowBackorders && quantity > product.quantity) {
            return Response.json(
              {
                success: false,
                error: `Only ${product.quantity} items available in stock`,
                availableQuantity: product.quantity,
              },
              { status: 400 },
            )
          }
        } catch (error) {
          return Response.json(
            {
              success: false,
              error: 'Product not found',
            },
            { status: 404 },
          )
        }

        // Update quantity
        updatedItems = items.map((item: CartItem, index: number) =>
          index === existingItemIndex ? { ...item, quantity } : item,
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
          message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
          data: {
            itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            items: updatedItems,
          },
        },
        200,
        req,
      )
    } catch (error) {
      console.error('Error updating cart:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to update cart',
        },
        { status: 500 },
      )
    }
  },
}
