import type { Endpoint } from 'payload'
import type { User, Product } from '@/payload-types'

interface CartItem {
  product: string | Product
  quantity: number
  price: number
  variantId?: string
}

interface RequestCartItem {
  product: string
  quantity: number
}

interface CreateOrderRequest {
  shippingAddress: {
    label?: string
    firstName: string
    lastName: string
    state?: string
    country: string
    phone?: string
    nearbyLandmark?: string
    detailedDirections?: string
    coordinates?: {
      latitude: number | null
      longitude: number | null
    }
    isDefault?: boolean
  }
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card'
  currency: 'USD' | 'AFN'
  saveAddress?: boolean
  guestEmail?: string
  items?: RequestCartItem[]
}

export const createOrder: Endpoint = {
  path: '/create-order',
  method: 'post',
  handler: async (req) => {
    const { payload, user } = req

    // Parse request body
    let body: CreateOrderRequest
    try {
      body = (await req.json?.()) || req.body
    } catch (_e) {
      return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const {
      shippingAddress,
      paymentMethod,
      currency,
      saveAddress,
      guestEmail,
      items: requestItems,
    } = body

    // Validate required fields
    if (!shippingAddress || !paymentMethod || !currency) {
      return Response.json(
        { error: 'Missing required fields: shippingAddress, paymentMethod, currency' },
        { status: 400 },
      )
    }

    // For guest checkout, require guestEmail
    if (!user && !guestEmail) {
      return Response.json({ error: 'Email is required for guest checkout' }, { status: 400 })
    }

    try {
      // Get cart items - either from request or from user's saved cart
      let cart: CartItem[]
      let userDoc: User | null = null

      if (requestItems && Array.isArray(requestItems) && requestItems.length > 0) {
        // Use items from request - they'll be enriched with price data later
        cart = requestItems as unknown as CartItem[]
      } else if (user) {
        // Fall back to fetching from database (only if authenticated)
        userDoc = await payload.findByID({
          collection: 'users',
          id: user.id,
        })

        cart = userDoc.cart as CartItem[]
      } else {
        // Guest user must provide items in request
        return Response.json(
          { error: 'Cart items are required for guest checkout' },
          { status: 400 },
        )
      }

      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return Response.json({ error: 'Cart is empty' }, { status: 400 })
      }

      // Calculate order totals
      let subtotal = 0
      const orderItems: Array<{
        product: string
        quantity: number
        price: number
        total: number
        variantId?: string
      }> = []

      for (const cartItem of cart) {
        const productId =
          typeof cartItem.product === 'string' ? cartItem.product : cartItem.product.id
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
        })

        if (!product) {
          return Response.json({ error: `Product ${cartItem.product} not found` }, { status: 400 })
        }

        // Fetch variant if specified
        let variant = null
        let variantDetails = null
        if (cartItem.variantId) {
          try {
            variant = await payload.findByID({
              collection: 'product-variants',
              id: cartItem.variantId,
            })
            // Store variant details snapshot for historical record
            variantDetails = {
              sku: variant.sku,
              options: variant.options,
              price: variant.price,
            }
          } catch (_error) {
            return Response.json(
              { error: `Variant ${cartItem.variantId} not found` },
              { status: 400 },
            )
          }
        }

        // Check stock availability - use variant stock if available, otherwise product stock
        const stockSource = variant || product
        if (
          stockSource.trackQuantity === true &&
          !stockSource.allowBackorders &&
          (stockSource.quantity || 0) < cartItem.quantity
        ) {
          const itemName = variant ? `${product.name} (${variant.sku})` : product.name
          return Response.json({ error: `Insufficient stock for ${itemName}` }, { status: 400 })
        }

        // Use variant price if available, otherwise product price
        let price = product.salePrice || product.price
        if (variant && variant.price) {
          price = variant.price
        }
        const itemTotal = price * cartItem.quantity

        subtotal += itemTotal

        orderItems.push({
          product: product.id,
          quantity: cartItem.quantity,
          price,
          total: itemTotal,
          ...(cartItem.variantId && { variant: cartItem.variantId }),
          ...(variantDetails && { variantDetails }),
        })

        // Update product inventory and analytics (always)
        const analytics = product.analytics || {}
        const viewCount = analytics.viewCount || 0
        const addToCartCount = analytics.addToCartCount || 0
        const newTotalSold = (product.totalSold || 0) + cartItem.quantity

        // Recalculate conversion rates with updated totalSold
        const conversionRate = viewCount > 0 ? (newTotalSold / viewCount) * 100 : 0
        const cartConversionRate = addToCartCount > 0 ? (newTotalSold / addToCartCount) * 100 : 0

        // Build update data for product - only include quantity if tracking inventory
        const productUpdateData: {
          quantity?: number
          totalSold: number
          analytics: {
            conversionRate: number
            cartConversionRate: number
            [key: string]: unknown
          }
        } = {
          totalSold: newTotalSold,
          analytics: {
            ...analytics,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            cartConversionRate: parseFloat(cartConversionRate.toFixed(2)),
          },
        }

        if (product.trackQuantity === true && !variant) {
          productUpdateData.quantity = Math.max(0, (product.quantity || 0) - cartItem.quantity)
        }

        await payload.update({
          collection: 'products',
          id: product.id,
          data: productUpdateData,
        })

        // Update variant inventory if variant was used
        if (variant) {
          const variantUpdateData: {
            quantity?: number
            totalSold: number
          } = {
            totalSold: (variant.totalSold || 0) + cartItem.quantity,
          }

          if (variant.trackQuantity === true) {
            variantUpdateData.quantity = Math.max(0, (variant.quantity || 0) - cartItem.quantity)
          }

          await payload.update({
            collection: 'product-variants',
            id: variant.id,
            data: variantUpdateData,
          })
        }
      }

      // Calculate shipping
      const shipping = subtotal > 100 ? 0 : 10
      const total = subtotal + shipping

      // Create order
      const orderData: {
        orderNumber: string
        items: typeof orderItems
        subtotal: number
        shipping: number
        total: number
        shippingAddress: typeof shippingAddress
        paymentMethod: 'cod' | 'bank_transfer' | 'credit_card'
        paymentStatus: 'pending' | 'paid' | 'failed'
        status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
        currency: 'USD' | 'AFN'
        customer?: string
        guestEmail?: string
      } = {
        orderNumber: `ORD-${Date.now()}`, // Auto-generated order number
        items: orderItems,
        subtotal,
        shipping,
        total,
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          state: shippingAddress.state || '',
          country: shippingAddress.country,
          phone: shippingAddress.phone || '',
          nearbyLandmark: shippingAddress.nearbyLandmark || '',
          detailedDirections: shippingAddress.detailedDirections || '',
          coordinates: shippingAddress.coordinates || { latitude: null, longitude: null },
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        status: 'pending',
        currency,
      }

      // Add customer or guestEmail based on authentication
      if (user) {
        orderData.customer = user.id
      } else {
        orderData.guestEmail = guestEmail
      }

      const order = await payload.create({
        collection: 'orders',
        data: orderData,
      })

      // Save address to user profile if requested (only for authenticated users)
      if (user && saveAddress && shippingAddress.label && userDoc) {
        const currentAddresses = userDoc.addresses || []

        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            addresses: [
              ...currentAddresses,
              {
                label: shippingAddress.label,
                firstName: shippingAddress.firstName,
                lastName: shippingAddress.lastName,
                state: shippingAddress.state,
                country: shippingAddress.country,
                phone: shippingAddress.phone,
                nearbyLandmark: shippingAddress.nearbyLandmark,
                detailedDirections: shippingAddress.detailedDirections,
                coordinates: shippingAddress.coordinates,
                isDefault: shippingAddress.isDefault || false,
              },
            ],
          },
        })
      }

      // Clear user's cart (only if we used the database cart and user is authenticated)
      if (user && !requestItems) {
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            cart: [],
          },
        })
      }

      return Response.json(
        {
          success: true,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
          },
        },
        { status: 201 },
      )
    } catch (error: unknown) {
      console.error('Create order error:', error)

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create order. Please try again.'

      return Response.json(
        {
          error: errorMessage,
          details: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 },
      )
    }
  },
}
