import type { CollectionConfig, Where } from 'payload'
import { isAdminField } from '../access/isAdmin'
import { isAdminOrDeveloper } from '../access/isAdminOrDeveloper'
import { nobody } from '../access/nobody'
import { anyone } from '../access/anyone'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'total', 'status', 'paymentStatus', 'createdAt'],
    group: 'E-commerce',
  },
  access: {
    /**
     * READ ACCESS
     * - Admins/Developers: Can read all orders
     * - Sellers: Can only read orders containing their products
     * - Customers: Can only read their own orders
     * - Guests: No access (must use specific endpoints with order ID)
     */
    read: ({ req: { user } }) => {
      // Technical staff can read all orders
      if (
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer')
      ) {
        return true
      }

      // Sellers can only read orders containing their products
      if (user?.roles?.includes('seller')) {
        return {
          'items.productSeller': {
            equals: user.id,
          },
        } as Where
      }

      // Customers can only read their own orders
      if (user) {
        return {
          customer: {
            equals: user.id,
          },
        }
      }

      // Guest users cannot read orders via API (must use endpoint with order ID)
      return false
    },
    /**
     * CREATE ACCESS
     * - Authenticated users can create orders
     * - Guests create orders via API endpoint (which handles validation)
     * - Note: API endpoint is the primary order creation path
     */
    create: anyone, // Endpoint handles all validation and security
    /**
     * UPDATE ACCESS
     * - Admins/Developers: Can update any order
     * - Sellers: Can only update orders containing their products (limited by validation hook)
     * - Customers: No update access (read-only for customers)
     */
    update: ({ req: { user } }) => {
      if (!user) return false

      // Technical staff can update any order
      if (
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')
      ) {
        return true
      }

      // Sellers can only update orders containing their products
      if (user.roles?.includes('seller')) {
        return {
          'items.productSeller': {
            equals: user.id,
          },
        } as Where
      }

      return false
    },
    /**
     * DELETE ACCESS
     * - Only admins and developers can delete orders
     * - Prevents accidental order deletion
     * - Maintains order history integrity
     */
    delete: isAdminOrDeveloper,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation: _operation }) => {
        if (!data) return data

        // Generate order number if not exists
        if (!data.orderNumber) {
          data.orderNumber = `ORD-${Date.now()}`
        }

        // Populate productSeller for each order item from the product
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            if (item.product && !item.productSeller) {
              try {
                // Fetch the product to get its seller
                const product = await req.payload.findByID({
                  collection: 'products',
                  id: typeof item.product === 'string' ? item.product : item.product.id,
                })

                if (product?.seller) {
                  item.productSeller =
                    typeof product.seller === 'string' ? product.seller : product.seller.id
                }
              } catch (error) {
                req.payload.logger.error(`Failed to fetch product seller: ${error}`)
              }
            }
          }
        }

        return data
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Restore inventory when an order is deleted
        if (!doc || !doc.items || !Array.isArray(doc.items)) {
          return
        }

        req.payload.logger.info(`Restoring inventory for deleted order: ${doc.orderNumber}`)

        for (const item of doc.items) {
          try {
            const productId = typeof item.product === 'string' ? item.product : item.product?.id
            const variantId = typeof item.variant === 'string' ? item.variant : item.variant?.id

            if (!productId) {
              req.payload.logger.warn(
                'Order item missing product ID, skipping inventory restoration',
              )
              continue
            }

            // Fetch the product
            const product = await req.payload.findByID({
              collection: 'products',
              id: productId,
            })

            if (!product) {
              req.payload.logger.warn(
                `Product ${productId} not found, skipping inventory restoration`,
              )
              continue
            }

            // Update product analytics and totalSold
            const analytics = product.analytics || {}
            const viewCount = analytics.viewCount || 0
            const addToCartCount = analytics.addToCartCount || 0
            const newTotalSold = Math.max(0, (product.totalSold || 0) - item.quantity)

            // Recalculate conversion rates with updated totalSold
            const conversionRate = viewCount > 0 ? (newTotalSold / viewCount) * 100 : 0
            const cartConversionRate =
              addToCartCount > 0 ? (newTotalSold / addToCartCount) * 100 : 0

            // Build update data for product
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

            // Restore product inventory if tracking is enabled and no variant
            if (product.trackQuantity === true && !variantId) {
              productUpdateData.quantity = (product.quantity || 0) + item.quantity
            }

            await req.payload.update({
              collection: 'products',
              id: productId,
              data: productUpdateData,
            })

            req.payload.logger.info(
              `Restored ${item.quantity} units to product ${productId}, new totalSold: ${newTotalSold}`,
            )

            // Restore variant inventory if variant was used
            if (variantId) {
              try {
                const variant = await req.payload.findByID({
                  collection: 'product-variants',
                  id: variantId,
                })

                if (variant) {
                  const variantUpdateData: {
                    quantity?: number
                    totalSold: number
                  } = {
                    totalSold: Math.max(0, (variant.totalSold || 0) - item.quantity),
                  }

                  if (variant.trackQuantity === true) {
                    variantUpdateData.quantity = (variant.quantity || 0) + item.quantity
                  }

                  await req.payload.update({
                    collection: 'product-variants',
                    id: variantId,
                    data: variantUpdateData,
                  })

                  req.payload.logger.info(
                    `Restored ${item.quantity} units to variant ${variantId}, new totalSold: ${variantUpdateData.totalSold}`,
                  )
                }
              } catch (error) {
                req.payload.logger.error(`Failed to restore variant inventory: ${error}`)
              }
            }
          } catch (error) {
            req.payload.logger.error(`Failed to restore inventory for order item: ${error}`)
          }
        }
      },
    ],
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data

        const user = req.user

        // Check if user has elevated privileges (admin/superadmin/developer)
        const hasElevatedPrivileges =
          user?.roles?.includes('admin') ||
          user?.roles?.includes('superadmin') ||
          user?.roles?.includes('developer')

        // Validate seller status updates (only if seller WITHOUT elevated privileges)
        const isSellerOnly = user?.roles?.includes('seller') && !hasElevatedPrivileges

        if (operation === 'update' && isSellerOnly) {
          const allowedStatuses = ['processing', 'shipped', 'delivered']

          if (data.status && !allowedStatuses.includes(data.status)) {
            throw new Error('Sellers can only update status to: processing, shipped, or delivered')
          }

          // Prevent sellers from modifying totals or prices
          if (
            data.subtotal !== undefined ||
            data.total !== undefined ||
            data.shipping !== undefined
          ) {
            throw new Error('Sellers cannot modify order totals')
          }
        }

        // Customers cannot update their own orders
        if (operation === 'update' && user && !hasElevatedPrivileges && !isSellerOnly) {
          throw new Error('Customers cannot modify orders')
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      access: {
        // Order number is auto-generated, prevent manual updates
        update: nobody,
      },
      admin: {
        readOnly: true,
        description: 'Auto-generated unique order identifier',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      access: {
        /**
         * CUSTOMER FIELD READ ACCESS
         * - Admins/Developers: Can see customer for all orders
         * - Customers: Can see their own customer info
         * - Sellers: Cannot see customer info (privacy protection)
         */
        read: ({ req: { user }, doc }) => {
          if (!user) return false
          // Technical staff can see customer info
          if (
            user.roles?.includes('admin') ||
            user.roles?.includes('superadmin') ||
            user.roles?.includes('developer')
          ) {
            return true
          }
          // Customer can see their own info
          if (doc?.customer === user.id) {
            return true
          }
          // Sellers cannot see customer info (privacy)
          return false
        },
      },
      admin: {
        description: 'Leave empty for guest orders',
      },
    },
    {
      name: 'guestEmail',
      type: 'email',
      access: {
        // Only admins and developers can see guest email (privacy protection)
        read: isAdminField,
      },
      admin: {
        description: 'Email for guest checkout orders',
        condition: (data) => !data.customer,
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'variant',
              type: 'relationship',
              relationTo: 'product-variants',
              filterOptions: ({ siblingData }): Where => {
                // Only show variants that belong to the selected product
                const product = (siblingData as Record<string, unknown>)?.product as
                  | string
                  | { id: string }
                  | undefined
                if (product) {
                  const productId = typeof product === 'string' ? product : product.id
                  return {
                    product: {
                      equals: productId,
                    },
                  } as Where
                }
                // If no product selected, show no variants (return impossible condition)
                return {
                  id: {
                    equals: '',
                  },
                } as Where
              },
              admin: {
                width: '50%',
                description: 'Product variant (if applicable)',
                // Only show variant field if product has variants enabled
                condition: (data, siblingData) => {
                  const product = (siblingData as Record<string, unknown>)?.product as
                    | string
                    | { id: string; hasVariants?: boolean }
                    | undefined
                  // Show if product has hasVariants set to true
                  if (product && typeof product === 'object' && product.hasVariants) {
                    return true
                  }
                  // Default to showing the field (when loading or product not fully loaded)
                  return true
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              type: 'number',
              required: true,
              min: 1,
              admin: {
                width: '33%',
              },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              admin: {
                width: '33%',
              },
            },
            {
              name: 'total',
              type: 'number',
              required: true,
              admin: {
                width: '34%',
              },
            },
          ],
        },
        {
          name: 'variantDetails',
          type: 'json',
          admin: {
            readOnly: true,
            description: 'Snapshot of variant details at time of order (for historical record)',
            // Only show to developers
            condition: (data, siblingData, { user }) => {
              return !!user?.roles?.includes('developer')
            },
          },
        },
        {
          name: 'productSeller',
          type: 'relationship',
          relationTo: 'users',
          required: false,
          access: {
            // Auto-populated from product, prevent manual updates
            update: nobody,
          },
          admin: {
            description: 'Seller who owns this product (auto-populated)',
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subtotal',
          type: 'number',
          required: true,
          access: {
            // Only admins/developers can modify financial fields
            update: isAdminField,
          },
          admin: {
            width: '25%',
          },
        },
        {
          name: 'shipping',
          type: 'number',
          defaultValue: 0,
          access: {
            // Only admins/developers can modify financial fields
            update: isAdminField,
          },
          admin: {
            width: '25%',
          },
        },
        {
          name: 'total',
          type: 'number',
          required: true,
          access: {
            // Only admins/developers can modify financial fields
            update: isAdminField,
          },
          admin: {
            width: '25%',
          },
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      access: {
        /**
         * SHIPPING ADDRESS READ ACCESS
         * - Admins/Developers: Can see full shipping address
         * - Customers: Can see their own shipping address
         * - Sellers: Cannot see full address (privacy protection)
         */
        read: ({ req: { user }, doc }) => {
          if (!user) return false
          // Technical staff can see full shipping address
          if (
            user.roles?.includes('admin') ||
            user.roles?.includes('superadmin') ||
            user.roles?.includes('developer')
          ) {
            return true
          }
          // Customer can see their own shipping address
          if (doc?.customer === user.id) {
            return true
          }
          // Sellers cannot see full shipping address (privacy protection)
          return false
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'firstName',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'lastName',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'state',
              type: 'text',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'country',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'nearbyLandmark',
          type: 'text',
        },
        {
          name: 'detailedDirections',
          type: 'textarea',
        },
        {
          name: 'coordinates',
          type: 'group',
          admin: {
            hidden: true,
          },
          fields: [
            {
              name: 'latitude',
              type: 'number',
            },
            {
              name: 'longitude',
              type: 'number',
            },
            {
              name: 'accuracy',
              type: 'number',
              admin: {
                description: 'Location accuracy in meters',
              },
            },
            {
              name: 'source',
              type: 'select',
              options: [
                { label: 'GPS', value: 'gps' },
                { label: 'IP Address', value: 'ip' },
                { label: 'Manual Entry', value: 'manual' },
                { label: 'Map Selection', value: 'map' },
              ],
              admin: {
                description: 'How the location was obtained',
              },
            },
            {
              name: 'ip',
              type: 'text',
              admin: {
                description: 'IP address when location was captured',
              },
            },
          ],
        },
        {
          name: 'locationMap',
          type: 'ui',
          admin: {
            components: {
              Field: '/fields/orderLocationMap#OrderLocationMapField',
            },
          },
        },
      ],
    },
    {
      name: 'trackingNumber',
      type: 'text',
      access: {
        /**
         * TRACKING NUMBER UPDATE ACCESS
         * - Admins/Developers: Can update any tracking number
         * - Sellers: Can update tracking for orders containing their products
         */
        update: ({ req: { user }, doc }) => {
          if (!user) return false
          // Technical staff can update any tracking number
          if (
            user.roles?.includes('admin') ||
            user.roles?.includes('superadmin') ||
            user.roles?.includes('developer')
          ) {
            return true
          }
          // Sellers can update tracking for their orders
          if (user.roles?.includes('seller')) {
            // Check if any item in the order belongs to this seller
            return (
              doc?.items?.some(
                (item: { productSeller?: string }) => item.productSeller === user.id,
              ) ?? false
            )
          }
          return false
        },
      },
      admin: {
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
      },
    },
    {
      name: 'customerNote',
      type: 'textarea',
      admin: {
        description: 'Customer note for this order (e.g., delivery instructions)',
        placeholder:
          'آیا چیزی هست که بخواهید به ما بگویید؟ مثلاً "ساعت ۹ تا ۱۱ صبح بیارید وگرنه خونه نیستم"',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      access: {
        // Only admins and developers can see and edit internal notes
        read: isAdminField,
        update: isAdminField,
      },
      admin: {
        description: 'Internal notes - only visible to admins and developers',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Processing',
          value: 'processing',
        },
        {
          label: 'Shipped',
          value: 'shipped',
        },
        {
          label: 'Delivered',
          value: 'delivered',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
      ],
      access: {
        /**
         * STATUS FIELD UPDATE ACCESS
         * - Admins/Developers: Can update to any status
         * - Sellers: Can update status for their orders (limited to: processing, shipped, delivered)
         * - Customers: Cannot update status
         */
        update: ({ req: { user }, doc }) => {
          if (!user) return false
          // Technical staff can update to any status
          if (
            user.roles?.includes('admin') ||
            user.roles?.includes('superadmin') ||
            user.roles?.includes('developer')
          ) {
            return true
          }
          // Sellers can update status for their orders (limited by validation hook)
          if (user.roles?.includes('seller')) {
            // Sellers can only update orders containing their products
            return (
              doc?.items?.some(
                (item: { productSeller?: string }) => item.productSeller === user.id,
              ) ?? false
            )
          }
          // Customers cannot update status
          return false
        },
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
      ],
      access: {
        // Only admins and developers can update payment status
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        {
          label: 'Cash on Delivery',
          value: 'cod',
        },
        {
          label: 'Bank Transfer',
          value: 'bank_transfer',
        },
        {
          label: 'Credit Card',
          value: 'credit_card',
        },
      ],
      access: {
        // Until we add online payment features it will be fixed on COD method
        update: nobody,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'AFN',
      access: {
        update: nobody,
      },
      options: [
        {
          label: 'AFN (Afghan Afghani)',
          value: 'AFN',
        },
        {
          label: 'USD',
          value: 'USD',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
