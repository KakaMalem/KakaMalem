import { type CollectionConfig, type Where } from 'payload'
import { isAdminOrDeveloper, isAdminOrDeveloperField } from '../access/isAdminOrDeveloper'
import { isAdminSellerOrDeveloper } from '../access/isAdminSellerOrDeveloper'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { createIsAdminOrSellerOwner } from '../access/isAdminOrSellerOwner'
import { nobody } from '../access/nobody'
import { isSuperAdminOrDeveloper } from '../access/isSuperAdminOrDeveloper'
import { slugField } from '../fields/slug'
import { populatePublishedAt } from '../hooks/populatePublishedAt'

/**
 * PRODUCTS COLLECTION - INVENTORY MANAGEMENT GUIDE
 * =================================================
 *
 * ## Inventory Tracking System
 *
 * ### trackQuantity Flag (Default: true)
 * Controls whether the product uses automatic inventory tracking:
 *
 * **When trackQuantity === TRUE (Recommended for physical products):**
 * ├─ stockStatus is AUTO-CALCULATED via beforeChange hook (READ-ONLY in admin)
 * ├─ quantity field is EDITABLE
 * ├─ lowStockThreshold is EDITABLE (default: 5)
 * ├─ Stock validation enforced during add-to-cart and checkout
 * ├─ Quantity automatically decrements on order completion
 * └─ Automatic stock status transitions:
 *    ├─ quantity > lowStockThreshold → 'in_stock'
 *    ├─ 0 < quantity ≤ lowStockThreshold → 'low_stock'
 *    ├─ quantity === 0 && allowBackorders → 'on_backorder'
 *    └─ quantity === 0 && !allowBackorders → 'out_of_stock'
 *
 * **When trackQuantity === FALSE (For digital products, services):**
 * ├─ stockStatus is MANUALLY EDITABLE by admins
 * ├─ quantity field is HIDDEN (not used)
 * ├─ lowStockThreshold is HIDDEN
 * ├─ NO stock validation during purchases (unlimited availability)
 * ├─ Quantity NEVER decrements
 * └─ Perfect for: digital downloads, consultations, subscriptions
 *
 * ### Stock Status Types
 * - 'in_stock': Available for purchase
 * - 'out_of_stock': Not available (will not allow purchase)
 * - 'low_stock': Available but quantity is low (warning only)
 * - 'on_backorder': Out of stock but accepting orders
 * - 'discontinued': Permanently unavailable (BLOCKS all purchases)
 *
 * ## Product Variants System
 *
 * ### Enabling Variants
 * Set hasVariants = true and define variantOptions (e.g., Size, Color)
 *
 * ### Auto-Generation Process (afterChange hook)
 * 1. Creates all possible combinations from variantOptions
 * 2. Each variant INHERITS initial product settings:
 *    ├─ trackQuantity, quantity, stockStatus, lowStockThreshold, allowBackorders
 *    └─ Product images (can be overridden per variant)
 * 3. First variant is marked as default (isDefault: true)
 * 4. Variants are INDEPENDENT after creation (no automatic sync)
 *
 * ### Variant Independence
 * IMPORTANT: After creation, variants DO NOT sync with product changes!
 * - Changing product.quantity does NOT update variant quantities
 * - Changing product.trackQuantity does NOT affect existing variants
 * - Each variant manages its own inventory independently
 *
 * ### Hierarchical Stock Control
 * Product-level status OVERRIDES variant status:
 * - product.stockStatus === 'discontinued' → ALL variants blocked ❌
 * - product.stockStatus === 'out_of_stock' → ALL variants blocked ❌
 * - product.stockStatus === 'in_stock' → Check individual variant status ✓
 *
 * ## Purchase Flow & Inventory Updates
 *
 * ### Add to Cart Validation
 * 1. Check product stockStatus (discontinued/out_of_stock → reject)
 * 2. Check variant stockStatus if applicable
 * 3. Validate quantity against available stock (if trackQuantity === true)
 * 4. Update product.analytics.addToCartCount
 *
 * ### Checkout & Order Creation
 * 1. Re-validate stock status (product → variant)
 * 2. Re-validate quantity availability
 * 3. Decrement quantity (if trackQuantity === true):
 *    ├─ For products WITHOUT variants: product.quantity -= orderQty
 *    └─ For products WITH variants: variant.quantity -= orderQty
 * 4. Increment totalSold (ALWAYS, regardless of trackQuantity)
 * 5. Recalculate conversion rates (conversionRate, cartConversionRate)
 *
 * ## Analytics Tracking
 * All products track analytics (visible to superadmins/developers only):
 * - viewCount: Total product detail page views
 * - uniqueViewCount: Unique viewers (tracked via localStorage/DB)
 * - addToCartCount: Times added to cart
 * - wishlistCount: Times added to wishlist
 * - totalSold: Total units sold (includes variants)
 * - conversionRate: (totalSold / viewCount) × 100
 * - cartConversionRate: (totalSold / addToCartCount) × 100
 *
 * ## Admin Access Control
 * - Developers, Superadmins, Admins: Full access to all products
 * - Sellers: Can create/edit/delete only their own products
 *   ├─ seller field is AUTO-ASSIGNED on creation
 *   └─ Cannot modify other sellers' products
 * - Customers: Can view published products only
 *
 * ## Frontend Display Priority (Product Cards)
 * When displaying products with variants, the system intelligently selects which
 * variant to showcase based on availability and business logic:
 *
 * 1. Default variant (if AVAILABLE)
 * 2. Best-selling AVAILABLE variant (if default unavailable/not set)
 * 3. Default variant (even if unavailable - respects admin choice)
 * 4. Best-selling variant (even if unavailable - shows popularity)
 * 5. First AVAILABLE variant (new products, no sales yet)
 * 6. First variant (fallback when all unavailable)
 *
 * This prioritization ensures:
 * - Customers see purchasable items first
 * - Admin's default choice is respected when available
 * - Popular variants get visibility when default is unavailable
 * - System gracefully handles out-of-stock scenarios
 */

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
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Auto-generate variants when variant options are defined or changed
        if (doc.hasVariants && doc.variantOptions && doc.variantOptions.length > 0) {
          // Only generate on create or when variant options change
          const shouldGenerate =
            operation === 'create' ||
            JSON.stringify(previousDoc?.variantOptions) !== JSON.stringify(doc.variantOptions)

          if (shouldGenerate) {
            try {
              // Get all existing variants for this product
              const existingVariants = await req.payload.find({
                collection: 'product-variants',
                where: {
                  product: {
                    equals: doc.id,
                  },
                },
                limit: 1000,
              })

              // Generate all possible combinations
              type VariantOption = { name: string; value: string }
              type VariantCombination = VariantOption[]

              const generateCombinations = (
                options: Array<{ name: string; values: Array<{ value: string }> }>,
              ): VariantCombination[] => {
                if (options.length === 0) return [[]]
                if (options.length === 1) {
                  return options[0].values.map((v) => [{ name: options[0].name, value: v.value }])
                }

                const [first, ...rest] = options
                const restCombinations = generateCombinations(rest)
                const combinations: VariantCombination[] = []

                for (const value of first.values) {
                  for (const restCombo of restCombinations) {
                    combinations.push([{ name: first.name, value: value.value }, ...restCombo])
                  }
                }

                return combinations
              }

              const combinations = generateCombinations(doc.variantOptions)

              // Create variants for new combinations
              let createdCount = 0
              for (const combo of combinations) {
                // Check if this combination already exists
                const exists = existingVariants.docs.some((v) => {
                  return (
                    combo.every((opt) =>
                      v.options?.some((vOpt) => vOpt.name === opt.name && vOpt.value === opt.value),
                    ) && v.options?.length === combo.length
                  )
                })

                if (!exists) {
                  // Generate SKU from product name and options
                  const skuParts = [
                    doc.name
                      .substring(0, 10)
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, ''),
                  ]
                  combo.forEach((opt) => {
                    skuParts.push(opt.value.substring(0, 3).toUpperCase())
                  })
                  const sku = skuParts.join('-')

                  // Inherit images from product (so you can customize per variant later)
                  const variantImages = doc.images || []

                  await req.payload.create({
                    collection: 'product-variants',
                    data: {
                      product: doc.id,
                      sku: `${sku}-${Date.now()}`, // Add timestamp to ensure uniqueness
                      options: combo,
                      isDefault: createdCount === 0, // First variant is default
                      trackQuantity: doc.trackQuantity || false,
                      quantity: doc.quantity || 0,
                      lowStockThreshold: doc.lowStockThreshold || 5,
                      stockStatus: doc.stockStatus || 'in_stock',
                      allowBackorders: doc.allowBackorders || false,
                      images: variantImages, // Inherit product images by default
                    },
                  })
                  createdCount++
                }
              }

              if (createdCount > 0) {
                req.payload.logger.info(
                  `Auto-generated ${createdCount} variants for product ${doc.name}`,
                )
              }
            } catch (error) {
              req.payload.logger.error(`Failed to auto-generate variants: ${error}`)
            }
          }
        }
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
        condition: (data, siblingData, { user }) => isSuperAdminOrDeveloper(user),
      },
    },
    {
      name: 'analytics',
      type: 'group',
      access: {
        // Analytics fields are read-only - only system can update
        update: nobody,
      },
      admin: {
        description: 'Product performance analytics (system-managed)',
        condition: (data, siblingData, { user }) => isSuperAdminOrDeveloper(user),
      },
      fields: [
        {
          name: 'viewCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Total number of product page views',
          },
        },
        {
          name: 'uniqueViewCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of unique users who viewed this product',
          },
        },
        {
          name: 'addToCartCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of times product was added to cart',
          },
        },
        {
          name: 'wishlistCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Number of times added to wishlist',
          },
        },
        {
          name: 'conversionRate',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Conversion rate (purchases / views) as percentage',
          },
        },
        {
          name: 'cartConversionRate',
          type: 'number',
          defaultValue: 0,
          admin: {
            readOnly: true,
            description: 'Cart to purchase rate (purchases / add-to-cart) as percentage',
          },
        },
        {
          name: 'lastViewedAt',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Timestamp of last product view',
          },
        },
        {
          name: 'viewedByUsers',
          type: 'array',
          admin: {
            readOnly: true,
            description: 'Track unique users who viewed (for unique view count)',
          },
          fields: [
            {
              name: 'userId',
              type: 'text',
              required: true,
            },
            {
              name: 'viewedAt',
              type: 'date',
              required: true,
            },
          ],
        },
      ],
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
      name: 'hasVariants',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Enable if product has variants (size, color, etc.)',
      },
    },
    {
      name: 'variantOptions',
      type: 'array',
      admin: {
        description:
          '✨ Define options here (e.g., Size: S/M/L, Color: Red/Blue). Variants will be AUTO-GENERATED when you save!',
        condition: (data) => data?.hasVariants === true,
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Option name (e.g., "Size", "Color")',
          },
        },
        {
          name: 'values',
          type: 'array',
          required: true,
          minRows: 1,
          admin: {
            description: 'Available values for this option',
          },
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                description: 'Option value (e.g., "Small", "Red")',
                width: '50%',
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Optional: Image for this option (e.g., color swatch, product thumbnail)',
                width: '50%',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'variantManager',
      type: 'ui',
      admin: {
        components: {
          Field: '@/fields/variantManager',
        },
        condition: (data) => data?.hasVariants === true,
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
      name: 'trackQuantity',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Enable inventory tracking for this product',
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
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      required: false,
      hasMany: true,
      admin: {
        description: 'Product images. Optional if product has variants with their own images.',
      },
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
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
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
        condition: (data) => data?.trackQuantity === true,
        description: 'Allow purchases when out of stock',
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
