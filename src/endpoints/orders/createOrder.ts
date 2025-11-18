import type { Endpoint } from 'payload'

interface CreateOrderRequest {
  shippingAddress: {
    label?: string
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state?: string
    postalCode: string
    country: string
    phone?: string
    isDefault?: boolean
  }
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card'
  currency: 'USD' | 'AF'
  saveAddress?: boolean
  guestEmail?: string
  items?: Array<{
    product: string
    quantity: number
  }>
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
    } catch (e) {
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
      let cart: any[]
      let userDoc: any = null

      if (requestItems && Array.isArray(requestItems) && requestItems.length > 0) {
        // Use items from request
        cart = requestItems
      } else if (user) {
        // Fall back to fetching from database (only if authenticated)
        userDoc = await payload.findByID({
          collection: 'users',
          id: user.id,
        })

        cart = userDoc.cart as any
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
      const orderItems: any[] = []

      for (const cartItem of cart) {
        const product = await payload.findByID({
          collection: 'products',
          id: cartItem.product,
        })

        if (!product) {
          return Response.json({ error: `Product ${cartItem.product} not found` }, { status: 400 })
        }

        // Check stock availability
        if (
          product.trackQuantity &&
          !product.allowBackorders &&
          product.quantity < cartItem.quantity
        ) {
          return Response.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
        }

        const price = product.salePrice || product.price
        const itemTotal = price * cartItem.quantity

        subtotal += itemTotal

        orderItems.push({
          product: product.id,
          quantity: cartItem.quantity,
          price,
          total: itemTotal,
        })

        // Update product inventory
        if (product.trackQuantity) {
          const newQuantity = Math.max(0, product.quantity - cartItem.quantity)
          await payload.update({
            collection: 'products',
            id: product.id,
            data: {
              quantity: newQuantity,
            },
          })
        }
      }

      // Calculate shipping
      const shipping = subtotal > 100 ? 0 : 10
      const total = subtotal + shipping

      // Create order
      const orderData: any = {
        items: orderItems,
        subtotal,
        shipping,
        total,
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address1: shippingAddress.address1,
          address2: shippingAddress.address2 || '',
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone || '',
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
                address1: shippingAddress.address1,
                address2: shippingAddress.address2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postalCode: shippingAddress.postalCode,
                country: shippingAddress.country,
                phone: shippingAddress.phone,
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
