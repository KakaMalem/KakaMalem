import type { CollectionConfig, Where } from 'payload'
import {
  isAdminOrDeveloper as _isAdminOrDeveloper,
  isAdminOrDeveloperField as _isAdminOrDeveloperField,
} from '../access/isAdminOrDeveloper'
import { slugField } from '../fields/slug'

/**
 * CATEGORIES COLLECTION
 * =====================
 *
 * Unified category system for both main site and storefronts.
 *
 * ## Store Assignment
 * - Categories with NO stores: Shown on main site (kakamalem.com)
 * - Categories with `showOnMainStore: true`: Shown on main site
 * - Categories with stores assigned: Shown on those specific storefronts
 * - A category can belong to multiple stores AND the main site
 *
 * ## Access Control
 * - Admins/Developers: Full access to all categories
 * - Storefront owners: Can create/manage categories for their own stores
 * - Public: Can view active categories
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  timestamps: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'stores', 'showOnMainStore', 'showInMenu', 'displayOrder'],
    group: 'E-commerce',
    hidden: ({ user }) => {
      // Show to admins, superadmins, developers, sellers, and storefront owners
      return !(
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer') ||
        user?.roles?.includes('seller') ||
        user?.roles?.includes('storefront_owner')
      )
    },
  },
  access: {
    /**
     * READ ACCESS
     * - Admins, Developers: Can read all categories
     * - Sellers/Storefront owners: Can read all categories (needed for product category assignment)
     * - Public: Can only read active categories
     */
    read: ({ req: { user } }): boolean | Where => {
      // Technical staff can read all
      if (
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer')
      ) {
        return true
      }
      // Sellers and storefront owners can read all categories
      // This is needed for product category assignment to work
      if (user?.roles?.includes('seller') || user?.roles?.includes('storefront_owner')) {
        return true
      }
      // Public can read all categories (showInMenu controls visibility in UI)
      return true
    },
    /**
     * CREATE ACCESS
     * - Admins, Developers: Can create any category
     * - Storefront owners: Can create categories (will be assigned to their store)
     */
    create: ({ req: { user } }) => {
      if (!user) return false
      return !!(
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer') ||
        user.roles?.includes('storefront_owner')
      )
    },
    /**
     * UPDATE ACCESS
     * - Admins, Developers: Can update any category
     * - Storefront owners: Can only update categories in their own stores
     */
    update: ({ req: { user } }): boolean | Where => {
      if (!user) return false
      if (
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')
      ) {
        return true
      }
      // Storefront owners can only update their store's categories
      if (user.roles?.includes('storefront_owner')) {
        return {
          'stores.seller': {
            equals: user.id,
          },
        }
      }
      return false
    },
    /**
     * DELETE ACCESS
     * - Admins, Developers: Can delete any category
     * - Storefront owners: Can only delete categories in their own stores
     */
    delete: ({ req: { user } }): boolean | Where => {
      if (!user) return false
      if (
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')
      ) {
        return true
      }
      // Storefront owners can only delete their store's categories
      if (user.roles?.includes('storefront_owner')) {
        return {
          'stores.seller': {
            equals: user.id,
          },
        }
      }
      return false
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-assign storefront for storefront owners creating categories
        if (operation === 'create' && req.user?.roles?.includes('storefront_owner')) {
          // If no stores assigned and not explicitly for main store, assign to their storefront
          if ((!data.stores || data.stores.length === 0) && !data.showOnMainStore) {
            const storefront = await req.payload.find({
              collection: 'storefronts',
              where: {
                seller: {
                  equals: req.user.id,
                },
              },
              limit: 1,
            })

            if (storefront.docs.length > 0) {
              data.stores = [storefront.docs[0].id]
            } else {
              throw new Error('You must create a storefront before adding categories.')
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
    },
    ...slugField('name', { collectionSlug: 'categories' }),
    {
      name: 'smallCategoryImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Category thumbnail (recommended: 200x200px)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    // Store assignment
    {
      name: 'showOnMainStore',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this category on the main KakaMalem store',
        condition: (_data, _siblingData, { user }) => {
          // Only admins can set main store visibility
          return !!(
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin') ||
            user?.roles?.includes('developer')
          )
        },
      },
    },
    {
      name: 'stores',
      type: 'relationship',
      relationTo: 'storefronts',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Storefronts where this category is shown. Leave empty for main site only.',
        condition: (_data, _siblingData, { user }) => {
          // Show for admins, developers, and storefront owners
          return !!(
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin') ||
            user?.roles?.includes('developer') ||
            user?.roles?.includes('storefront_owner')
          )
        },
      },
      filterOptions: ({ user }) => {
        // Technical staff can select any active storefront
        if (
          user?.roles?.includes('admin') ||
          user?.roles?.includes('superadmin') ||
          user?.roles?.includes('developer')
        ) {
          return {
            status: {
              equals: 'active',
            },
          } as Where
        }
        // Storefront owners can only select their own storefronts
        return {
          seller: {
            equals: user?.id,
          },
        }
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Order in which category appears (lower = first)',
      },
    },
    {
      name: 'showInMenu',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Show in navigation menu',
      },
    },
  ],
}
