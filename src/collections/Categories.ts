import type { CollectionConfig } from 'payload'
import { isAdminOrDeveloper } from '../access/isAdminOrDeveloper'
import { isAdminSellerOrDeveloper } from '../access/isAdminSellerOrDeveloper'
import { nobody } from '../access/nobody'

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
     * - Admins, Developers, Sellers: Can create categories
     * - Customers: No access
     */
    create: isAdminSellerOrDeveloper,
    /**
     * UPDATE ACCESS
     * - Admins, Developers, Sellers: Can update categories
     * - Customers: No access
     */
    update: isAdminSellerOrDeveloper,
    /**
     * DELETE ACCESS
     * - Only admins and developers can delete categories
     * - Prevents sellers from accidentally removing categories
     * - Ensures category structure integrity
     */
    delete: isAdminOrDeveloper,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-generate slug from name whenever name changes
        if (data.name) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      access: {
        // Slug is auto-generated from name, prevent manual updates
        update: nobody,
      },
      admin: {
        readOnly: true,
        description: 'Auto-generated from category name',
      },
    },
    {
      name: 'categoryImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'textarea',
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
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            width: '50%',
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
      ],
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
