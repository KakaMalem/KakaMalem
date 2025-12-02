import { type CollectionConfig, type Where } from 'payload'
import { isAdminOrDeveloper, isAdminOrDeveloperField } from '../access/isAdminOrDeveloper'
import { isAdminSellerOrDeveloper } from '../access/isAdminSellerOrDeveloper'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { createIsAdminOrSellerOwner } from '../access/isAdminOrSellerOwner'
import { nobody } from '../access/nobody'
import { slugField } from '../fields/slug'
import { populatePublishedAt } from '../hooks/populatePublishedAt'

export const Products: CollectionConfig = {
  slug: 'products',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'quantity', '_status', 'stockStatus', 'updatedAt'],
    group: 'E-commerce',
    preview: (doc) => `${process.env.NEXT_PUBLIC_SERVER_URL}/products/${doc.slug}`,
  },
  access: {
    /**
     * READ ACCESS
     * - Admins, Developers, Sellers: Full access (including drafts)
     * - Customers/Public: Only published products
     */
    read: authenticatedOrPublished,
    /**
     * CREATE ACCESS
     * - Admins/Developers: Can create any product
     * - Sellers: Can create products (auto-assigned as seller via hook)
     */
    create: isAdminSellerOrDeveloper,
    /**
     * UPDATE ACCESS
     * - Admins/Developers: Can update any product
     * - Sellers: Can only update their own products
     * - Customers: No access
     */
    update: createIsAdminOrSellerOwner('seller'),
    /**
     * DELETE ACCESS
     * - Admins/Developers: Full delete access
     * - Sellers: No delete access (prevents accidental deletion, admins handle this)
     * - Prevents sellers from deleting products with existing orders/reviews
     */
    delete: isAdminOrDeveloper,
  },
  hooks: {
    beforeChange: [
      populatePublishedAt,
      ({ data, req, operation }) => {
        // Auto-populate seller when a seller creates a product
        if (operation === 'create' && req.user) {
          // If no seller is explicitly set
          if (!data.seller) {
            // Sellers automatically become the seller
            if (req.user.roles?.includes('seller')) {
              data.seller = req.user.id
            }
            // Admins can create products without a seller (platform products)
            // or they can explicitly set a seller in the UI
          }
        }

        // Auto-update stock status based on quantity if trackQuantity is enabled
        if (data.trackQuantity && data.stockStatus !== 'discontinued') {
          const quantity = data.quantity ?? 0
          const lowStockThreshold = data.lowStockThreshold ?? 5

          if (quantity === 0) {
            if (data.allowBackorders) {
              data.stockStatus = 'on_backorder'
            } else {
              data.stockStatus = 'out_of_stock'
            }
          } else if (quantity <= lowStockThreshold) {
            data.stockStatus = 'low_stock'
          } else {
            data.stockStatus = 'in_stock'
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'averageRating',
      type: 'number',
      defaultValue: 0,
      access: {
        // Read-only field - only system can update via hooks
        update: nobody,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Average rating (calculated from approved reviews)',
      },
    },
    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      access: {
        // Read-only field - only system can update via hooks
        update: nobody,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Number of approved reviews',
      },
    },
    {
      name: 'totalSold',
      type: 'number',
      defaultValue: 0,
      access: {
        // Read-only field - only system can update via hooks/order processing
        update: nobody,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total number of units sold',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      admin: {
        description: 'Brief summary for listings',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'salePrice',
          type: 'number',
          min: 0,
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
            width: '50%',
          },
        },
        {
          name: 'sku',
          type: 'text',
          unique: true,
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
          name: 'quantity',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'lowStockThreshold',
          type: 'number',
          defaultValue: 5,
          min: 0,
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: true,
      hasMany: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'stockStatus',
      type: 'select',
      required: true,
      defaultValue: 'in_stock',
      options: [
        {
          label: 'In Stock',
          value: 'in_stock',
        },
        {
          label: 'Out of Stock',
          value: 'out_of_stock',
        },
        {
          label: 'Low Stock',
          value: 'low_stock',
        },
        {
          label: 'On Backorder',
          value: 'on_backorder',
        },
        {
          label: 'Discontinued',
          value: 'discontinued',
        },
      ],
      admin: {
        position: 'sidebar',
        description: 'Inventory/stock status of the product',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'trackQuantity',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'allowBackorders',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'requiresShipping',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    ...slugField('name'),
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      access: {
        /**
         * SELLER FIELD UPDATE ACCESS
         * - Only admins and developers can manually reassign products to different sellers
         * - Sellers cannot change the seller field (prevents unauthorized product transfer)
         * - Maintains audit trail and ownership integrity
         */
        update: isAdminOrDeveloperField,
      },
      admin: {
        position: 'sidebar',
        description:
          'Seller who owns this product (leave empty for platform products). Auto-assigned for sellers.',
        condition: (data, siblingData, { user }) => {
          // Technical staff always see this field
          if (
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin') ||
            user?.roles?.includes('developer')
          ) {
            return true
          }
          // Sellers see it but it's read-only (controlled by access.update)
          return !!user?.roles?.includes('seller')
        },
      },
      filterOptions: ({ user }) => {
        // Technical staff can select any seller
        if (
          user?.roles?.includes('admin') ||
          user?.roles?.includes('superadmin') ||
          user?.roles?.includes('developer')
        ) {
          return {
            roles: {
              contains: 'seller',
            },
          } as Where
        }
        // Sellers can only see themselves
        return {
          id: {
            equals: user?.id,
          },
        }
      },
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 2500, // Autosave every 2.5 seconds
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
