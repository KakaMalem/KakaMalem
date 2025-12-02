import type { PayloadRequest, Endpoint } from 'payload'
import { getGuestCart, clearGuestCart } from '../../utilities/cartUtils'
import type { CartItem, CartData } from './types'

/**
 * Merges guest cart with user cart on login
 * Called after successful authentication
 */
export const mergeCart: Endpoint = {
  path: '/cart/merge',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const user = req.user

      // Must be authenticated
      if (!user) {
        return Response.json(
          {
            success: false,
            error: 'Authentication required',
          },
          { status: 401 },
        )
      }

      // Get guest cart from session/cookies
      const guestCart = await getGuestCart(req)
      const guestItems: CartItem[] = guestCart.items || []

      // If guest cart is empty, nothing to merge
      if (guestItems.length === 0) {
        const userCart: CartData = user.cart ? (user.cart as unknown as CartData) : { items: [] }
        return Response.json(
          {
            success: true,
            message: 'No items to merge',
            data: {
              itemCount: userCart.items.reduce(
                (sum: number, item: CartItem) => sum + item.quantity,
                0,
              ),
              items: userCart.items,
            },
          },
          { status: 200 },
        )
      }

      // Get user's existing cart
      const userCart: CartData = user.cart ? (user.cart as unknown as CartData) : { items: [] }
      const userItems: CartItem[] = userCart.items || []

      // Merge logic: combine items, sum quantities for duplicates
      const mergedItemsMap = new Map<string, CartItem>()

      // Add user items first
      userItems.forEach((item: CartItem) => {
        const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId
        mergedItemsMap.set(key, { ...item })
      })

      // Merge guest items
      const stockErrors: string[] = []

      for (const guestItem of guestItems) {
        const key = guestItem.variantId
          ? `${guestItem.productId}-${guestItem.variantId}`
          : guestItem.productId
        const existingItem = mergedItemsMap.get(key)

        let newQuantity = guestItem.quantity
        if (existingItem) {
          newQuantity = existingItem.quantity + guestItem.quantity
        }

        // Cap at 100 items per product
        if (newQuantity > 100) {
          newQuantity = 100
        }

        // Check stock availability
        try {
          const product = await req.payload.findByID({
            collection: 'products',
            id: guestItem.productId,
          })

          if (product && (!product._status || product._status === 'published')) {
            if (product.trackQuantity && newQuantity > product.quantity) {
              // Adjust to available quantity
              newQuantity = product.quantity
              stockErrors.push(`${product.name}: adjusted to ${product.quantity} (available stock)`)
            }

            mergedItemsMap.set(key, {
              productId: guestItem.productId,
              quantity: newQuantity,
              ...(guestItem.variantId && { variantId: guestItem.variantId }),
              addedAt: existingItem?.addedAt || guestItem.addedAt || new Date().toISOString(),
            })
          }
          // Skip if product is no longer available
        } catch (error) {
          console.error(`Error checking product ${guestItem.productId} during merge:`, error)
          // Skip items that cause errors
        }
      }

      const mergedItems = Array.from(mergedItemsMap.values())

      // Limit merged cart to 50 items
      const finalItems = mergedItems.slice(0, 50)

      // Update user's cart
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          cart: { items: finalItems },
        },
      })

      // Clear guest cart
      await clearGuestCart(req)

      const itemCount = finalItems.reduce((sum, item) => sum + item.quantity, 0)

      return Response.json(
        {
          success: true,
          message: 'Cart merged successfully',
          data: {
            itemCount,
            items: finalItems,
            warnings: stockErrors.length > 0 ? stockErrors : undefined,
          },
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Error merging cart:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to merge cart',
        },
        { status: 500 },
      )
    }
  },
}
