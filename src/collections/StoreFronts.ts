import type { CollectionConfig, Where } from 'payload'
import { isAdminOrDeveloper, isAdminOrDeveloperField } from '../access/isAdminOrDeveloper'
import { createIsAdminOrSellerOwner } from '../access/isAdminOrSellerOwner'
import { slugField } from '../fields/slug'
import { nobody } from '../access/nobody'

/**
 * STOREFRONTS COLLECTION
 * ======================
 *
 * Enables sellers to create their own branded storefronts on the platform.
 * Each storefront is accessible at: kakamalem.com/store/[slug]
 *
 * ## Features
 * - Custom branding (logo, colors, banner)
 * - Curated product categories
 * - Seller-specific affiliate program
 * - Promo code management
 * - Analytics and performance tracking
 *
 * ## Access Control
 * - Sellers can create ONE storefront (enforced via beforeChange hook)
 * - Sellers can only update their own storefront
 * - Admins/Developers have full access
 * - Public can view active storefronts
 */
export const StoreFronts: CollectionConfig = {
  slug: 'storefronts',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'seller', 'status', 'updatedAt'],
    group: 'E-commerce',
    description: 'Seller storefronts for branded shopping experiences',
  },
  access: {
    // Public can view active storefronts
    read: ({ req: { user } }): boolean | Where => {
      // Admins/developers can see all
      if (
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer')
      ) {
        return true
      }
      // Sellers and storefront owners can see their own storefront
      if (user?.roles?.includes('seller') || user?.roles?.includes('storefront_owner')) {
        return {
          seller: {
            equals: user.id,
          },
        }
      }
      // Public can only see active storefronts
      return {
        status: {
          equals: 'active',
        },
      }
    },
    // Only sellers and storefront owners can create storefronts
    create: ({ req: { user } }) => {
      if (!user) return false
      return !!(
        user.roles?.includes('seller') ||
        user.roles?.includes('storefront_owner') ||
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')
      )
    },
    // Sellers/storefront owners can only update their own storefront
    update: createIsAdminOrSellerOwner('seller'),
    // Only admins can delete storefronts
    delete: isAdminOrDeveloper,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-populate seller when a seller/storefront owner creates a storefront
        if (operation === 'create' && req.user) {
          if (
            !data.seller &&
            (req.user.roles?.includes('seller') || req.user.roles?.includes('storefront_owner'))
          ) {
            data.seller = req.user.id
          }

          // Enforce one storefront per seller/storefront owner (unless admin/developer)
          if (
            (req.user.roles?.includes('seller') || req.user.roles?.includes('storefront_owner')) &&
            !req.user.roles?.includes('admin') &&
            !req.user.roles?.includes('superadmin') &&
            !req.user.roles?.includes('developer')
          ) {
            const existingStorefront = await req.payload.find({
              collection: 'storefronts',
              where: {
                seller: {
                  equals: req.user.id,
                },
              },
              limit: 1,
            })

            if (existingStorefront.docs.length > 0) {
              throw new Error('You already have a storefront. You can only have one storefront.')
            }
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
      admin: {
        description: 'Your store name (displayed in the header)',
      },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: {
        description: 'A short catchy phrase for your store (optional)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Describe your store and what makes it special',
      },
    },
    ...slugField('name'),
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: {
        update: isAdminOrDeveloperField,
      },
      admin: {
        position: 'sidebar',
        description: 'Store owner (auto-assigned for storefront owners)',
        condition: (data, siblingData, { user }) => {
          return !!(
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin') ||
            user?.roles?.includes('developer')
          )
        },
      },
      filterOptions: {
        roles: {
          contains: 'storefront_owner',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending_review',
      options: [
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Inactive', value: 'inactive' },
      ],
      access: {
        // Only admins can change status (approval workflow)
        update: isAdminOrDeveloperField,
      },
      admin: {
        position: 'sidebar',
        description: 'Storefront status (admin-controlled)',
      },
    },
    // Branding
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Branding',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Your store logo (recommended: 200x200px, transparent PNG)',
              },
            },
            {
              name: 'headerDisplay',
              type: 'select',
              defaultValue: 'logo_and_name',
              options: [
                { label: 'Logo and Name', value: 'logo_and_name' },
                { label: 'Logo Only', value: 'logo_only' },
                { label: 'Name Only', value: 'name_only' },
              ],
              admin: {
                description: 'Choose what to display in your store header',
              },
            },
            {
              name: 'favicon',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Browser tab icon (recommended: 32x32px)',
              },
            },
          ],
        },
        {
          label: 'Contact & Social',
          fields: [
            {
              name: 'contactEmail',
              type: 'email',
              admin: {
                description: 'Customer support email',
              },
            },
            {
              name: 'contactPhone',
              type: 'text',
              admin: {
                description: 'Customer support phone',
              },
            },
            {
              name: 'socialLinks',
              type: 'group',
              fields: [
                {
                  name: 'facebook',
                  type: 'text',
                  admin: {
                    description: 'Facebook page URL',
                  },
                },
                {
                  name: 'instagram',
                  type: 'text',
                  admin: {
                    description: 'Instagram profile URL',
                  },
                },
                {
                  name: 'twitter',
                  type: 'text',
                  admin: {
                    description: 'Twitter/X profile URL',
                  },
                },
                {
                  name: 'whatsapp',
                  type: 'text',
                  admin: {
                    description: 'WhatsApp number (with country code)',
                  },
                },
                {
                  name: 'telegram',
                  type: 'text',
                  admin: {
                    description: 'Telegram username or link',
                  },
                },
                {
                  name: 'tiktok',
                  type: 'text',
                  admin: {
                    description: 'TikTok profile URL',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Delivery',
          fields: [
            {
              name: 'deliverySettings',
              type: 'group',
              fields: [
                {
                  name: 'deliveryMode',
                  type: 'select',
                  defaultValue: 'free_above_threshold',
                  options: [
                    { label: 'Always Free', value: 'always_free' },
                    { label: 'Free Above Threshold', value: 'free_above_threshold' },
                    { label: 'Always Charged', value: 'always_charged' },
                  ],
                  admin: {
                    description: 'Delivery fee mode for your store',
                  },
                },
                {
                  name: 'freeDeliveryThreshold',
                  type: 'number',
                  min: 0,
                  defaultValue: 1000,
                  admin: {
                    description: 'Minimum order amount for free delivery (in AFN)',
                    condition: (data) =>
                      data?.deliverySettings?.deliveryMode === 'free_above_threshold',
                  },
                },
                {
                  name: 'deliveryFee',
                  type: 'number',
                  min: 0,
                  defaultValue: 50,
                  admin: {
                    description: 'Delivery fee when charged (in AFN)',
                    condition: (data) => data?.deliverySettings?.deliveryMode !== 'always_free',
                  },
                },
                {
                  name: 'deliveryNote',
                  type: 'text',
                  admin: {
                    description: 'Optional note about delivery (e.g., "Delivery within 24 hours")',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              fields: [
                {
                  name: 'metaTitle',
                  type: 'text',
                  admin: {
                    description: 'SEO title (defaults to store name)',
                  },
                },
                {
                  name: 'metaDescription',
                  type: 'textarea',
                  admin: {
                    description: 'SEO description for search engines',
                  },
                },
                {
                  name: 'ogImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Social media preview image (1200x630px)',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    // Analytics (read-only, system-managed)
    {
      name: 'analytics',
      type: 'group',
      access: {
        update: nobody,
      },
      admin: {
        description: 'Store performance metrics (system-managed)',
        condition: (data, siblingData, { user }) => {
          return !!(
            user?.roles?.includes('seller') ||
            user?.roles?.includes('storefront_owner') ||
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin') ||
            user?.roles?.includes('developer')
          )
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'totalViews',
              type: 'number',
              defaultValue: 0,
              admin: {
                readOnly: true,
                width: '25%',
              },
            },
            {
              name: 'uniqueVisitors',
              type: 'number',
              defaultValue: 0,
              admin: {
                readOnly: true,
                width: '25%',
              },
            },
            {
              name: 'totalOrders',
              type: 'number',
              defaultValue: 0,
              admin: {
                readOnly: true,
                width: '25%',
              },
            },
            {
              name: 'totalRevenue',
              type: 'number',
              defaultValue: 0,
              admin: {
                readOnly: true,
                width: '25%',
              },
            },
          ],
        },
        {
          name: 'lastVisited',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'viewedByUsers',
          type: 'json',
          admin: {
            readOnly: true,
            description: 'Array of user IDs who have viewed this storefront (max 1000)',
          },
        },
      ],
    },
  ],
}
