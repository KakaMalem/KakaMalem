import type { Endpoint } from 'payload'
import type { User, Product, SiteSetting } from '@/payload-types'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getGeoLocationFromRequest, updateUserLocation } from '@/utilities/geolocation'

interface CartItem {
  product: string | Product
  quantity: number
  price: number
  variantId?: string
}

interface RequestCartItem {
  product: string
  quantity: number
  variantId?: string
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
      accuracy?: number | null
      source?: 'gps' | 'ip' | 'manual' | 'map' | null
      ip?: string | null
    }
    isDefault?: boolean
  }
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card'
  currency: 'USD' | 'AFN'
  saveAddress?: boolean
  guestEmail?: string
  items?: RequestCartItem[]
  customerNote?: string
}

export const createOrder: Endpoint = {
  path: '/create-order',
  method: 'post',
  handler: async (req) => {
    const { payload } = req
    let user = req.user

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
      customerNote,
    } = body

    // Validate required fields
    if (!shippingAddress || !paymentMethod || !currency) {
      return Response.json(
        { error: 'Missing required fields: shippingAddress, paymentMethod, currency' },
        { status: 400 },
      )
    }

    // Validate coordinates are required
    if (
      !shippingAddress.coordinates ||
      !shippingAddress.coordinates.latitude ||
      !shippingAddress.coordinates.longitude
    ) {
      return Response.json(
        {
          error: 'Coordinates are required for delivery',
          hint: 'Please enable location access or select your location on the map',
        },
        { status: 400 },
      )
    }

    // If user is not populated but we have an email, try to find the user
    // This handles cases where req.user isn't populated (e.g., mobile access)
    if (!user && guestEmail) {
      try {
        const users = await payload.find({
          collection: 'users',
          where: {
            email: {
              equals: guestEmail.toLowerCase().trim(),
            },
          },
          limit: 1,
        })

        if (users.docs.length > 0) {
          // Found a user with this email - use it instead of guest checkout
          user = {
            ...users.docs[0],
            collection: 'users',
          } as User & { collection: 'users' }
        }
      } catch (error) {
        console.log('Error finding user by email:', error)
        // Continue as guest if lookup fails
      }
    }

    // For guest checkout, require guestEmail
    if (!user && !guestEmail) {
      return Response.json(
        {
          error: 'Email is required for guest checkout',
          hint: 'Please provide your email address or ensure you are logged in',
        },
        { status: 400 },
      )
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

        // Hierarchical stock check: Product-level status overrides variant status
        // If product is discontinued or out of stock, no variant can be purchased
        if (product.stockStatus === 'discontinued' || product.stockStatus === 'out_of_stock') {
          const message =
            product.stockStatus === 'discontinued'
              ? `${product.name} دیگر تولید نمی‌شود و قابل خرید نیست`
              : `${product.name} موجود نیست`
          return Response.json({ error: message }, { status: 400 })
        }

        // Check if product has variants and ALL variants are unavailable
        if (product.hasVariants) {
          const allVariants = await payload.find({
            collection: 'product-variants',
            where: {
              product: {
                equals: product.id,
              },
            },
          })

          const allVariantsUnavailable =
            allVariants.docs.length > 0 &&
            allVariants.docs.every(
              (v) => v.stockStatus === 'out_of_stock' || v.stockStatus === 'discontinued',
            )

          if (allVariantsUnavailable) {
            return Response.json(
              { error: `تمام گزینه‌های ${product.name} ناموجود هستند` },
              { status: 400 },
            )
          }
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

            // Check if variant is discontinued or out of stock
            // Note: Product-level check already done above, this is for variant-specific status
            if (variant.stockStatus === 'discontinued' || variant.stockStatus === 'out_of_stock') {
              const message =
                variant.stockStatus === 'discontinued'
                  ? `گزینه ${variant.sku} از ${product.name} دیگر تولید نمی‌شود و قابل خرید نیست`
                  : `گزینه ${variant.sku} از ${product.name} موجود نیست`
              return Response.json({ error: message }, { status: 400 })
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

        const orderItem: {
          product: string
          quantity: number
          price: number
          total: number
          variant?: string
          variantDetails?: typeof variantDetails
        } = {
          product: product.id,
          quantity: cartItem.quantity,
          price,
          total: itemTotal,
        }

        // Add variant if present
        if (cartItem.variantId) {
          orderItem.variant = cartItem.variantId
        }

        // Add variant details snapshot if present
        if (variantDetails) {
          orderItem.variantDetails = variantDetails
        }

        orderItems.push(orderItem)

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

      // Fetch site settings for delivery configuration
      let shippingMode = 'free_above_threshold' as NonNullable<SiteSetting['shippingMode']>
      let shippingCost = 50
      let freeDeliveryThreshold = 1000
      try {
        const siteSettings = await payload.findGlobal({
          slug: 'site-settings',
        })
        shippingMode = siteSettings.shippingMode ?? 'free_above_threshold'
        shippingCost = siteSettings.shippingCost ?? 50
        freeDeliveryThreshold = siteSettings.freeDeliveryThreshold ?? 1000
      } catch (error) {
        console.error('Error fetching site settings, using defaults:', error)
      }

      // Calculate shipping based on mode
      let shipping: number
      if (shippingMode === 'always_free') {
        shipping = 0
      } else if (shippingMode === 'always_charged') {
        shipping = shippingCost
      } else {
        // free_above_threshold (default)
        shipping = subtotal >= freeDeliveryThreshold ? 0 : shippingCost
      }
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
        customerNote?: string
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
          coordinates: shippingAddress.coordinates || {
            latitude: null,
            longitude: null,
            accuracy: null,
            source: null,
            ip: null,
          },
        },
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
        status: 'pending',
        currency,
        customerNote: customerNote || undefined,
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

      // Capture user location on order placement (non-blocking, authenticated users only)
      // Only update if user hasn't granted browser permission (browser GPS is more accurate)
      if (user) {
        const userLocation = (user as User).location
        if (!userLocation?.permissionGranted) {
          getGeoLocationFromRequest(req, 'order')
            .then((location) => updateUserLocation(payload, user.id, location))
            .catch((err) => console.error('Failed to capture location on order:', err))
        }
      }

      // Send order confirmation email
      const recipientEmail = user ? user.email : guestEmail
      const recipientName = shippingAddress.firstName || 'مشتری'

      if (recipientEmail) {
        try {
          // Format items for email
          const emailItems = orderItems
            .map((item) => {
              const productName =
                typeof item.product === 'object' ? (item.product as Product).name : 'محصول'
              return `<tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${productName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;" dir="ltr">${currency === 'AFN' ? '؋' : '$'}${item.price.toLocaleString()}</td>
              </tr>`
            })
            .join('')

          const currencySymbol = currency === 'AFN' ? '؋' : '$'
          const paymentMethodLabel =
            paymentMethod === 'cod'
              ? 'پرداخت هنگام تحویل'
              : paymentMethod === 'bank_transfer'
                ? 'انتقال بانکی'
                : 'کارت اعتباری'

          await payload.sendEmail({
            to: recipientEmail,
            subject: `تأیید سفارش #${order.orderNumber} - کاکا معلم`,
            html: `
              <!DOCTYPE html>
              <html dir="rtl" lang="fa">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; direction: rtl;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;" dir="rtl">
                  <tr>
                    <td style="padding: 40px 20px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" dir="rtl">
                        <!-- Header -->
                        <tr>
                          <td style="background-color: #16a34a; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">کاکا معلم</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">سفارش شما با موفقیت ثبت شد!</p>
                          </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 30px; text-align: right;" dir="rtl">
                            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; text-align: right;">سلام ${recipientName} عزیز،</h2>

                            <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
                              از خرید شما متشکریم! سفارش شما با موفقیت ثبت شد و در حال پردازش است.
                            </p>

                            <!-- Order Info -->
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                              <p style="margin: 0 0 10px 0; text-align: right;"><strong>شماره سفارش:</strong> ${order.orderNumber}</p>
                              <p style="margin: 0 0 10px 0; text-align: right;"><strong>روش پرداخت:</strong> ${paymentMethodLabel}</p>
                              <p style="margin: 0; text-align: right;"><strong>تاریخ سفارش:</strong> ${new Date().toLocaleDateString('fa-IR')}</p>
                            </div>

                            <!-- Order Items -->
                            <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px; text-align: right;">اقلام سفارش</h3>
                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;" dir="rtl">
                              <thead>
                                <tr style="background-color: #f3f4f6;">
                                  <th style="padding: 12px; text-align: right; font-weight: 600;">محصول</th>
                                  <th style="padding: 12px; text-align: center; font-weight: 600;">تعداد</th>
                                  <th style="padding: 12px; text-align: left; font-weight: 600;">قیمت</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${emailItems}
                              </tbody>
                            </table>

                            <!-- Totals -->
                            <div style="border-top: 2px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;" dir="rtl">
                                <tr>
                                  <td style="text-align: right; padding: 5px 0;">جمع جزء:</td>
                                  <td style="text-align: left; padding: 5px 0;" dir="ltr">${currencySymbol}${subtotal.toLocaleString()}</td>
                                </tr>
                                <tr>
                                  <td style="text-align: right; padding: 5px 0;">هزینه ارسال:</td>
                                  <td style="text-align: left; padding: 5px 0;" dir="ltr">${shipping === 0 ? 'رایگان' : `${currencySymbol}${shipping.toLocaleString()}`}</td>
                                </tr>
                                <tr style="font-size: 18px; font-weight: bold; color: #16a34a;">
                                  <td style="text-align: right; padding: 10px 0;">جمع کل:</td>
                                  <td style="text-align: left; padding: 10px 0;" dir="ltr">${currencySymbol}${total.toLocaleString()}</td>
                                </tr>
                              </table>
                            </div>

                            <!-- Shipping Address -->
                            <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px; text-align: right;">آدرس تحویل</h3>
                            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                              <p style="margin: 0 0 5px 0; text-align: right;"><strong>${shippingAddress.firstName} ${shippingAddress.lastName}</strong></p>
                              ${shippingAddress.state ? `<p style="margin: 0 0 5px 0; text-align: right;">${shippingAddress.state}، ${shippingAddress.country}</p>` : `<p style="margin: 0 0 5px 0; text-align: right;">${shippingAddress.country}</p>`}
                              ${shippingAddress.phone ? `<p style="margin: 0 0 5px 0; text-align: right;" dir="ltr">${shippingAddress.phone}</p>` : ''}
                              ${shippingAddress.nearbyLandmark ? `<p style="margin: 0; text-align: right; color: #6b7280;">${shippingAddress.nearbyLandmark}</p>` : ''}
                            </div>

                            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: right;">
                              می‌توانید وضعیت سفارش خود را از طریق حساب کاربری پیگیری کنید.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                              با تشکر از خرید شما از کاکا معلم
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          })
        } catch (emailError) {
          // Log but don't fail the order if email fails
          console.error('Order confirmation email error:', emailError)
        }
      }

      // Revalidate product pages to show updated stock quantities
      try {
        // Revalidate all product pages
        for (const item of orderItems) {
          const productId = typeof item.product === 'string' ? item.product : item.product
          const product = await payload.findByID({
            collection: 'products',
            id: productId,
          })

          if (product && product.slug) {
            // Revalidate product detail page
            revalidatePath(`/product/${product.slug}`)

            // Revalidate by product-specific tag
            revalidateTag(`product-${product.slug}`)

            // Revalidate category pages if product has categories
            if (product.categories && Array.isArray(product.categories)) {
              for (const category of product.categories) {
                if (typeof category === 'object' && 'slug' in category && category.slug) {
                  revalidatePath(`/category/${category.slug}`)
                }
              }
            }
          }
        }

        // Revalidate shop page and home page
        revalidatePath('/shop')
        revalidatePath('/')

        // Revalidate by general tag
        revalidateTag('products')
      } catch (revalidateError) {
        // Log but don't fail the order if revalidation fails
        console.error('Cache revalidation error:', revalidateError)
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
