import type { CollectionConfig, Where } from 'payload'
import { isAdminField } from '../access/isAdmin'
import { isAdminOrDeveloper } from '../access/isAdminOrDeveloper'
import { nobody } from '../access/nobody'
import { anyone } from '../access/anyone'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'total', 'status', 'createdAt'],
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
    beforeValidate: [
      ({ data, req, operation }) => {
        if (!data) return data

        const user = req.user

        // Validate seller status updates
        if (operation === 'update' && user?.roles?.includes('seller')) {
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
        if (
          operation === 'update' &&
          user &&
          !user.roles?.includes('admin') &&
          !user.roles?.includes('superadmin') &&
          !user.roles?.includes('developer') &&
          !user.roles?.includes('seller')
        ) {
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
                width: '40%',
              },
            },
            {
              name: 'variant',
              type: 'relationship',
              relationTo: 'product-variants',
              admin: {
                width: '30%',
                description: 'Product variant (if applicable)',
              },
            },
            {
              name: 'quantity',
              type: 'number',
              required: true,
              min: 1,
              admin: {
                width: '10%',
              },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              admin: {
                width: '10%',
              },
            },
            {
              name: 'total',
              type: 'number',
              required: true,
              admin: {
                width: '10%',
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
          fields: [
            {
              name: 'latitude',
              type: 'number',
            },
            {
              name: 'longitude',
              type: 'number',
            },
          ],
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
        // Only admins and developers can update payment method after creation
        update: isAdminField,
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
