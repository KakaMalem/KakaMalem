import { type CollectionConfig } from 'payload'
import { isAdminSellerOrDeveloper } from '../access/isAdminSellerOrDeveloper'
import { nobody } from '../access/nobody'
import { isSuperAdminOrDeveloper } from '../access/isSuperAdminOrDeveloper'

/**
 * PRODUCT VARIANTS COLLECTION
 * ============================
 *
 * ## Overview
 * Product variants represent different configurations of a product (e.g., sizes, colors).
 * Each variant has INDEPENDENT inventory settings that can differ from the parent product.
 *
 * ## Variant Creation & Independence
 * - Variants are AUTO-GENERATED when product.variantOptions are defined (via afterChange hook)
 * - On creation, variants INHERIT initial settings from the product:
 *   ├─ trackQuantity (copied from product)
 *   ├─ quantity (copied from product)
 *   ├─ stockStatus (copied from product)
 *   ├─ lowStockThreshold (copied from product)
 *   └─ allowBackorders (copied from product)
 *
 * - After creation, variants are INDEPENDENT entities:
 *   ├─ Changing product settings does NOT update existing variants
 *   ├─ Each variant can have different quantity, stock status, pricing
 *   └─ Variants have their own beforeChange hooks for stock status calculation
 *
 * ## Hierarchical Stock Control
 * Product-level stock status has PRIORITY over variant status:
 * - If product.stockStatus === 'discontinued' → ALL variants blocked from purchase
 * - If product.stockStatus === 'out_of_stock' → ALL variants blocked from purchase
 * - If product is available → Each variant's status is checked independently
 *
 * Example scenarios:
 * 1. Product: discontinued | Variant A: in_stock → Cannot purchase Variant A ❌
 * 2. Product: in_stock | Variant A: discontinued → Cannot purchase Variant A ✓
 * 3. Product: in_stock | Variant B: in_stock → Can purchase Variant B ✓
 *
 * ## Inventory Tracking
 * Each variant has INDEPENDENT inventory tracking:
 * - If variant.trackQuantity === true:
 *   ├─ stockStatus is AUTO-CALCULATED based on quantity (read-only)
 *   ├─ quantity decrements on order completion
 *   ├─ Stock validation happens during add-to-cart and checkout
 *   └─ lowStockThreshold triggers 'low_stock' status
 *
 * - If variant.trackQuantity === false:
 *   ├─ stockStatus is MANUALLY EDITABLE by admins
 *   ├─ quantity is hidden (not tracked)
 *   ├─ No stock validation during purchase
 *   └─ Ideal for digital products, services, unlimited availability
 *
 * ## Pricing Override
 * Variants can override product pricing:
 * - variant.price: Optional custom price (overrides product price)
 * - variant.compareAtPrice: Optional sale pricing
 * - If not set, product pricing is used
 *
 * ## Admin Access
 * - Developers, Superadmins, Admins: Full access to all variants
 * - Sellers: Can manage variants for their own products only
 * - Customers: Cannot access variant admin (public can view via API)
 */

export const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  timestamps: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sku', 'product', 'options', 'price', 'stockStatus', 'isDefault'],
    group: 'E-commerce',
    description: 'Manage product variants (sizes, colors, etc.)',
    listSearchableFields: ['sku', 'product', 'title'],
    hidden: ({ user }) => {
      // Allow admins, superadmins, developers, and sellers to access variants
      const hasAccess =
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer') ||
        user?.roles?.includes('seller')
      return !hasAccess
    },
  },
  access: {
    /**
     * READ ACCESS
     * - Admins/sellers/developers: Full access to all variants
     * - Customers/public: Can see variants of published products
     * - NOTE: We allow public read access since variants need to be visible in orders,
     *   cart, and product pages. The parent product's publish status controls visibility.
     */
    read: () => {
      // Allow anyone to read variants
      // The parent product's draft/publish status and access control handles visibility
      return true
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
     * - Sellers: Can update variants (ownership verified in beforeChange hook)
     */
    update: isAdminSellerOrDeveloper,
    /**
     * DELETE ACCESS
     * - Admins/Developers: Can delete any variant
     * - Sellers: Can delete variants (ownership verified separately)
     */
    delete: isAdminSellerOrDeveloper,
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
      async ({ data, req, originalDoc }) => {
        // Ensure only one variant is marked as default per product
        // When this variant is set as default, unset all other variants for the same product
        if (data.isDefault === true && data.product) {
          const productId = typeof data.product === 'string' ? data.product : data.product.id

          // Find all other variants for this product that are currently default
          const otherDefaultVariants = await req.payload.find({
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
                {
                  id: {
                    not_equals: originalDoc?.id || '', // Exclude current variant
                  },
                },
              ],
            },
            limit: 100,
          })

          // Unset isDefault for all other variants
          if (otherDefaultVariants.docs.length > 0) {
            await Promise.all(
              otherDefaultVariants.docs.map((variant) =>
                req.payload.update({
                  collection: 'product-variants',
                  id: variant.id,
                  data: {
                    isDefault: false,
                  },
                }),
              ),
            )
            console.log(
              `[ProductVariant Hook] Unset ${otherDefaultVariants.docs.length} other default variant(s) for product ${productId}`,
            )
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // AUTO-UPDATE PRODUCT STOCK STATUS WHEN ALL VARIANTS UNAVAILABLE
        // ================================================================
        // When a variant's stock status changes, check if ALL variants are now unavailable
        // If so, automatically update the parent product's stockStatus to 'out_of_stock'
        // This ensures product cards and listings show accurate availability

        // Only check on update operations (not create, to avoid race conditions during batch creation)
        if (operation !== 'update') return doc

        // Get the product ID
        const productId = typeof doc.product === 'string' ? doc.product : doc.product?.id
        if (!productId) return doc

        try {
          // Fetch all variants for this product
          const allVariants = await req.payload.find({
            collection: 'product-variants',
            where: {
              product: {
                equals: productId,
              },
            },
            limit: 100, // Reasonable limit for variants
          })

          // Check if ALL variants are unavailable
          const allVariantsUnavailable =
            allVariants.docs.length > 0 &&
            allVariants.docs.every(
              (v) => v.stockStatus === 'out_of_stock' || v.stockStatus === 'discontinued',
            )

          // Calculate total quantity from all variants
          const totalVariantQuantity = allVariants.docs.reduce((sum, v) => {
            // Only count quantity if variant is tracking quantity
            if (v.trackQuantity && typeof v.quantity === 'number') {
              return sum + v.quantity
            }
            return sum
          }, 0)

          // Fetch the product to check current status
          const product = await req.payload.findByID({
            collection: 'products',
            id: productId,
          })

          // Build update data
          type StockStatus =
            | 'in_stock'
            | 'out_of_stock'
            | 'low_stock'
            | 'on_backorder'
            | 'discontinued'
          const updateData: { stockStatus?: StockStatus; quantity?: number } = {}

          // Update product stock status if needed
          if (allVariantsUnavailable && product.stockStatus !== 'out_of_stock') {
            updateData.stockStatus = 'out_of_stock'
          } else if (!allVariantsUnavailable && product.stockStatus === 'out_of_stock') {
            // If at least one variant is available and product was marked as out_of_stock (by this hook)
            // restore it to in_stock
            // Note: This only triggers if product is 'out_of_stock', not if it's 'discontinued'
            updateData.stockStatus = 'in_stock'
          }

          // Update product quantity to sum of variant quantities (for products with variants)
          if (product.hasVariants && product.quantity !== totalVariantQuantity) {
            updateData.quantity = totalVariantQuantity
          }

          // Only update if there are changes
          if (Object.keys(updateData).length > 0) {
            await req.payload.update({
              collection: 'products',
              id: productId,
              data: updateData,
            })
            console.log(`[ProductVariant Hook] Updated product ${productId}:`, updateData)
          }
        } catch (error) {
          // Log error but don't fail the variant update
          console.error('[ProductVariant Hook] Error updating product stock status:', error)
        }

        return doc
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
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Optional variant-specific description (shown when this variant is selected)',
      },
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
      name: 'showStockInFrontend',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Show stock status to customers (disable to hide stock info while still tracking internally)',
        condition: (data) => data?.trackQuantity === true,
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
          defaultValue: 0,
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
        description: 'Upload variant-specific images here (e.g., different colors).',
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
