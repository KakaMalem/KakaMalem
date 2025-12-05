import { type CollectionConfig } from 'payload'
import { isAdminOrDeveloper } from '../access/isAdminOrDeveloper'
import { isAdminSellerOrDeveloper } from '../access/isAdminSellerOrDeveloper'
import { nobody } from '../access/nobody'
import { isSuperAdminOrDeveloper } from '../access/isSuperAdminOrDeveloper'
import { isDeveloper } from '@/access/isDeveloper'

export const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  timestamps: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'product', 'options', 'price', 'stockStatus', 'isDefault'],
    group: 'E-commerce',
    description: 'Manage product variants (sizes, colors, etc.)',
    listSearchableFields: ['sku', 'product', 'title'],
    hidden: () => {
      return !isDeveloper
    },
  },
  access: {
    /**
     * READ ACCESS
     * - Same as Products: admins/sellers see all, customers see only published parent products
     */
    read: ({ req: { user } }) => {
      // Technical staff and sellers have full access
      if (
        user?.roles?.includes('admin') ||
        user?.roles?.includes('developer') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('seller')
      ) {
        return true
      }

      // Public users can only see variants of published products
      return {
        '_product._status': {
          equals: 'published',
        },
      }
    },
    /**
     * CREATE ACCESS
     * - Admins/Developers: Can create any variant
     * - Sellers: Can create variants for their products
     */
    create: isAdminSellerOrDeveloper,
    /**
     * UPDATE ACCESS
     * - Admins/Developers: Can update any variant
     * - Sellers: Can only update variants of their own products
     */
    update: ({ req: { user } }) => {
      if (!user) return false

      // Technical staff have full access
      if (
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')
      ) {
        return true
      }

      // Sellers can only update variants of products they own
      if (user.roles?.includes('seller')) {
        return {
          '_product.seller': {
            equals: user.id,
          },
        }
      }

      return false
    },
    /**
     * DELETE ACCESS
     * - Only admins/developers can delete variants
     */
    delete: isAdminOrDeveloper,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Generate readable title from options
        const options = data.options || []
        if (options && options.length > 0) {
          const optionValues = options
            .map((opt: { name?: string; value?: string }) => opt.value)
            .filter(Boolean)
          data.title = optionValues.join(' / ')
        } else {
          data.title = 'Untitled Variant'
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
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        description: 'Parent product this variant belongs to',
      },
      index: true,
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique SKU for this variant (e.g., "TSHIRT-M-RED")',
      },
    },
    {
      name: 'options',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Variant options (e.g., Size: M, Color: Red)',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
                description: 'Option name (e.g., "Size", "Color")',
              },
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
                description: 'Option value (e.g., "Medium", "Red")',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark as default variant to display when product is first loaded',
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Override product price (leave empty to use product price)',
          },
        },
        {
          name: 'compareAtPrice',
          type: 'number',
          min: 0,
          admin: {
            width: '50%',
            description: 'Original price for sale pricing',
          },
        },
      ],
    },
    {
      name: 'trackQuantity',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Enable inventory tracking for this variant',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'quantity',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            width: '50%',
            condition: (data) => data?.trackQuantity === true,
            description: 'Current stock quantity',
          },
        },
        {
          name: 'lowStockThreshold',
          type: 'number',
          defaultValue: 5,
          min: 0,
          admin: {
            width: '50%',
            condition: (data) => data?.trackQuantity === true,
            description: 'Alert threshold for low stock',
          },
        },
      ],
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
      access: {
        // Only allow updates when trackQuantity is false
        update: ({ data }) => data?.trackQuantity !== true,
      },
      admin: {
        position: 'sidebar',
        description:
          'Stock status - Auto-managed when inventory tracking is enabled. Manual control when disabled.',
      },
    },
    {
      name: 'allowBackorders',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        condition: (data) => data?.trackQuantity === true,
        description: 'Allow purchases when out of stock',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description:
          '🎨 Upload variant-specific images here (e.g., different colors). Images auto-switch when customers select this variant!',
      },
    },
    {
      name: 'totalSold',
      type: 'number',
      defaultValue: 0,
      access: {
        // Read-only field - only system can update via order processing
        update: nobody,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total number of units sold',
        condition: (data, siblingData, { user }) => isSuperAdminOrDeveloper(user),
      },
    },
  ],
}
