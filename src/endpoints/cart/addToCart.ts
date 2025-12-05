import type { PayloadRequest, Endpoint } from 'payload'
import { getGuestCart, saveGuestCart, createCartResponse } from '../../utilities/cartUtils'
import type { CartItem, CartData } from './types'

export const addToCart: Endpoint = {
  path: '/cart/add',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const body = await req.json?.()
      const { productId, quantity = 1, variantId } = body || {}

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

      if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
        return Response.json(
          {
            success: false,
            error: 'Quantity must be a positive integer',
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

      // Verify product exists and is available
      let product
      try {
        product = await req.payload.findByID({
          collection: 'products',
          id: productId,
        })
      } catch (_error) {
        return Response.json(
          {
            success: false,
            error: 'Product not found',
          },
          { status: 404 },
        )
      }

      // Check if product is published (or has no _status for legacy products)
      if (!product || (product._status && product._status !== 'published')) {
        return Response.json(
          {
            success: false,
            error: 'Product is not available',
          },
          { status: 400 },
        )
      }

      // If variantId provided, verify it exists and belongs to this product
      let variant = null
      let finalVariantId = variantId

      if (variantId) {
        try {
          variant = await req.payload.findByID({
            collection: 'product-variants',
            id: variantId,
          })

          // Check variant belongs to this product
          const variantProductId =
            typeof variant.product === 'string' ? variant.product : variant.product.id
          if (variantProductId !== productId) {
            return Response.json(
              {
                success: false,
                error: 'Variant does not belong to this product',
              },
              { status: 400 },
            )
          }
        } catch (_error) {
          return Response.json(
            {
              success: false,
              error: 'Variant not found',
            },
            { status: 404 },
          )
        }
      }

      // For products with variants, automatically select default variant if none provided
      if (product.hasVariants && !finalVariantId) {
        try {
          const defaultVariants = await req.payload.find({
            collection: 'product-variants',
            where: {
              and: [
                {
                  product: {
                    equals: productId,
                  },
                },
                {
                  isDefault: {
                    equals: true,
                  },
                },
              ],
            },
            limit: 1,
          })

          if (defaultVariants.docs && defaultVariants.docs.length > 0) {
            variant = defaultVariants.docs[0]
            finalVariantId = variant.id
          } else {
            // If no default variant found, try to get the first variant
            const firstVariant = await req.payload.find({
              collection: 'product-variants',
              where: {
                product: {
                  equals: productId,
                },
              },
              limit: 1,
              sort: 'createdAt',
            })

            if (firstVariant.docs && firstVariant.docs.length > 0) {
              variant = firstVariant.docs[0]
              finalVariantId = variant.id
            } else {
              return Response.json(
                {
                  success: false,
                  error: 'No variants available for this product',
                },
                { status: 400 },
              )
            }
          }
        } catch (_error) {
          return Response.json(
            {
              success: false,
              error: 'Failed to find product variant',
            },
            { status: 500 },
          )
        }
      }

      // Get current cart (from user or session)
      const user = req.user
      let currentCart: CartData = { items: [] }

      if (user && user.cart) {
        // Type assertion for user cart stored as JSON
        currentCart = user.cart as unknown as CartData
      }

      if (!user) {
        currentCart = await getGuestCart(req)
      }

      const items: CartItem[] = currentCart.items || []

      // Check if item already exists in cart
      // const itemKey = finalVariantId ? `${productId}-${finalVariantId}` : productId
      const existingItemIndex = items.findIndex(
        (item: CartItem) =>
          item.productId === productId &&
          (finalVariantId ? item.variantId === finalVariantId : !item.variantId),
      )

      let updatedItems: CartItem[]
      let newQuantity = quantity

      if (existingItemIndex !== -1) {
        // Update existing item
        const currentInCart = items[existingItemIndex].quantity
        newQuantity = currentInCart + quantity

        // Stock validation - use variant stock if variant selected, otherwise product stock
        const stockSource = variant || product
        if (stockSource.trackQuantity === true && !stockSource.allowBackorders) {
          if (newQuantity > (stockSource.quantity || 0)) {
            const availableToAdd = Math.max(0, (stockSource.quantity || 0) - currentInCart)
            return Response.json(
              {
                success: false,
                error: `Cannot add ${quantity} more. You already have ${currentInCart} in your cart. Only ${stockSource.quantity} available in stock (you can add ${availableToAdd} more)`,
                availableQuantity: stockSource.quantity,
                currentInCart: currentInCart,
                availableToAdd: availableToAdd,
              },
              { status: 400 },
            )
          }
        }

        updatedItems = items.map((item: CartItem, index: number) =>
          index === existingItemIndex
            ? { ...item, quantity: newQuantity, addedAt: new Date().toISOString() }
            : item,
        )
      } else {
        // Add new item
        // Stock validation - use variant stock if variant selected, otherwise product stock
        const stockSource = variant || product
        if (
          stockSource.trackQuantity === true &&
          !stockSource.allowBackorders &&
          quantity > (stockSource.quantity || 0)
        ) {
          return Response.json(
            {
              success: false,
              error: `Only ${stockSource.quantity} items available in stock`,
              availableQuantity: stockSource.quantity,
            },
            { status: 400 },
          )
        }

        const newItem: CartItem = {
          productId,
          quantity,
          ...(finalVariantId && { variantId: finalVariantId }),
          addedAt: new Date().toISOString(),
        }

        updatedItems = [...items, newItem]
      }

      // Limit cart size
      if (updatedItems.length > 50) {
        return Response.json(
          {
            success: false,
            error: 'Maximum cart size (50 items) reached',
          },
          { status: 400 },
        )
      }

      // Update product analytics - increment addToCartCount
      const analytics = product.analytics || {}
      const addToCartCount = (analytics.addToCartCount || 0) + 1
      const viewCount = analytics.viewCount || 0
      const totalSold = product.totalSold || 0

      // Recalculate conversion rates
      const conversionRate = viewCount > 0 ? (totalSold / viewCount) * 100 : 0
      const cartConversionRate = addToCartCount > 0 ? (totalSold / addToCartCount) * 100 : 0

      // Save cart and update analytics in parallel
      if (user) {
        // Update authenticated user's cart and product analytics
        await Promise.all([
          req.payload.update({
            collection: 'users',
            id: user.id,
            data: {
              cart: { items: updatedItems },
            },
          }),
          req.payload.update({
            collection: 'products',
            id: productId,
            data: {
              analytics: {
                ...analytics,
                addToCartCount,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                cartConversionRate: parseFloat(cartConversionRate.toFixed(2)),
              },
            },
          }),
        ])
        // Clear guest cart cookie for authenticated users
        await saveGuestCart(req, { items: [] })
      } else {
        // Save guest cart to session and update analytics
        await Promise.all([
          saveGuestCart(req, { items: updatedItems }),
          req.payload.update({
            collection: 'products',
            id: productId,
            data: {
              analytics: {
                ...analytics,
                addToCartCount,
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                cartConversionRate: parseFloat(cartConversionRate.toFixed(2)),
              },
            },
          }),
        ])
      }

      return createCartResponse(
        {
          success: true,
          message: 'Product added to cart',
          data: {
            itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
            items: updatedItems,
          },
        },
        200,
        req,
      )
    } catch (error) {
      console.error('Error adding to cart:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to add product to cart',
        },
        { status: 500 },
      )
    }
  },
}
