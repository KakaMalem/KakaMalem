import type { CollectionConfig } from 'payload'
import { isAdminOrDeveloper } from '../access/isAdminOrDeveloper'
import { slugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'status', 'displayOrder'],
    group: 'E-commerce',
    hidden: ({ user }) => {
      // Only show to admins, superadmins, developers, and sellers
      return !(
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer') ||
        user?.roles?.includes('seller')
      )
    },
  },
  access: {
    /**
     * READ ACCESS
     * - Admins, Developers, Sellers: Can read all categories (including inactive/hidden)
     * - Public/Customers: Can only read active categories
     * - Ensures proper category visibility on storefront
     */
    read: ({ req: { user } }) => {
      // Technical and business staff can read all categories
      if (
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer') ||
        user?.roles?.includes('seller')
      ) {
        return true
      }
      // Public can only read active categories
      return {
        status: {
          equals: 'active',
        },
      }
    },
    /**
     * CREATE ACCESS
     * - Only admins and developers can create categories
     * - Sellers can read categories to assign to products but cannot create new ones
     */
    create: isAdminOrDeveloper,
    /**
     * UPDATE ACCESS
     * - Only admins and developers can update categories
     * - Ensures category structure integrity across the platform
     */
    update: isAdminOrDeveloper,
    /**
     * DELETE ACCESS
     * - Only admins and developers can delete categories
     * - Prevents sellers from accidentally removing categories
     * - Ensures category structure integrity
     */
    delete: isAdminOrDeveloper,
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
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category for hierarchy',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        width: '50%',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Inactive',
          value: 'inactive',
        },
        {
          label: 'Hidden',
          value: 'hidden',
        },
      ],
      admin: {
        position: 'sidebar',
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
      name: 'showInMenu',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
