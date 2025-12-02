import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminField } from '../access/isAdmin'
import { isAdminOrSelf } from '../access/isAdminOrSelf'
import { isDeveloperField } from '../access/isDeveloper'
import { isSuperAdminOrDeveloper } from '../access/isSuperAdminOrDeveloper'
import { nobody } from '../access/nobody'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'roles'],
    hidden: ({ user }) => {
      // Only show to admins, superadmins, and developers
      return !(
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer')
      )
    },
  },
  access: {
    /**
     * ADMIN PANEL ACCESS
     * - Superadmins, Admins, Developers: Full admin panel access
     * - Sellers: Limited admin panel access (products, orders, media)
     * - Customers: No admin panel access
     */
    admin: ({ req: { user } }) => {
      if (!user) return false
      return !!(
        user.roles?.includes('superadmin') ||
        user.roles?.includes('admin') ||
        user.roles?.includes('developer') ||
        user.roles?.includes('seller')
      )
    },
    /**
     * CREATE ACCESS
     * - Anyone can create users (public registration)
     * - New users default to 'customer' role
     * - Role elevation requires admin intervention
     */
    create: () => true,
    /**
     * READ ACCESS
     * - Admins: Can read all users
     * - Users: Can only read their own data
     * - Prevents user enumeration and data leakage
     */
    read: isAdminOrSelf,
    /**
     * UPDATE ACCESS
     * - Admins: Can update any user
     * - Users: Can only update their own data
     * - Field-level access controls restrict sensitive fields
     */
    update: isAdminOrSelf,
    /**
     * DELETE ACCESS
     * - Only admins and superadmins can delete users
     * - Prevents users from deleting their own accounts
     * - Ensures proper user lifecycle management
     */
    delete: isAdmin,
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days (when "remember me" is checked)
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    // verify: false, // Disable email verification for OAuth users
  },
  fields: [
    {
      name: 'sub',
      type: 'text',
      access: {
        // OAuth field - system managed, no manual updates
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers/superadmins
        condition: (data, siblingData, { user }) => {
          return isSuperAdminOrDeveloper(user)
        },
        description: 'OAuth provider subject ID (system-managed)',
      },
      index: true,
    },
    {
      name: 'picture',
      type: 'text',
      access: {
        // OAuth field - system managed, no manual updates
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers/superadmins
        condition: (data, siblingData, { user }) => {
          return isSuperAdminOrDeveloper(user)
        },
        description: 'OAuth provider profile picture URL (system-managed)',
      },
    },
    {
      name: 'hasPassword',
      type: 'checkbox',
      defaultValue: false,
      access: {
        // System-managed field, no manual updates
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers/superadmins
        condition: (data, siblingData, { user }) => {
          return isSuperAdminOrDeveloper(user)
        },
        description: 'Indicates if user has set a custom password (system-managed)',
      },
    },
    {
      name: 'ogfan',
      type: 'checkbox',
      defaultValue: false,
      access: {
        // Only developers can update this field (super exclusive!)
        update: isDeveloperField,
      },
      admin: {
        description: 'Original Fan - Early supporter badge',
        position: 'sidebar',
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
      },
    },
    {
      name: 'roles',
      type: 'select',
      required: true,
      hasMany: true,
      defaultValue: ['customer'],
      options: [
        {
          label: 'Customer',
          value: 'customer',
        },
        {
          label: 'Seller',
          value: 'seller',
        },
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Developer',
          value: 'developer',
        },
        {
          label: 'Super Admin',
          value: 'superadmin',
        },
      ],
      admin: {
        description:
          'User role permissions (Developer and Super Admin can only be assigned by Super Admins)',
        // Filter options based on user's role
        condition: (data, siblingData, { user }) => {
          // Show roles field to admins and superadmins
          return !!(user?.roles?.includes('admin') || user?.roles?.includes('superadmin'))
        },
      },
      access: {
        /**
         * ROLES FIELD ACCESS
         * - Only admins can assign/change roles
         * - Hook prevents non-superadmins from assigning superadmin/developer roles
         */
        create: isAdminField,
        update: isAdminField,
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            // Prevent non-superadmins from assigning superadmin or developer roles
            if (value && Array.isArray(value)) {
              const isSuperAdmin = req.user?.roles?.includes('superadmin')

              // Filter out restricted roles if user is not a superadmin
              if (!isSuperAdmin) {
                return value.filter((role: string) => role !== 'superadmin' && role !== 'developer')
              }
            }
            return value
          },
        ],
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: false, // Allow OAuth users without firstName
    },
    {
      name: 'lastName',
      type: 'text',
      required: false, // Allow OAuth users without lastName
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'addresses',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
          admin: {
            description: 'Province or region',
          },
        },
        {
          name: 'country',
          type: 'text',
          required: true,
        },
        {
          name: 'phone',
          type: 'text',
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'nearbyLandmark',
          type: 'text',
          admin: {
            description: 'Well-known nearby landmark (mosque, shop, building, etc.)',
          },
        },
        {
          name: 'detailedDirections',
          type: 'textarea',
          admin: {
            description: 'Step-by-step directions to help delivery find your location',
          },
        },
        {
          name: 'coordinates',
          type: 'group',
          fields: [
            {
              name: 'latitude',
              type: 'number',
              admin: {
                step: 0.000001,
                description: 'Latitude coordinate',
              },
            },
            {
              name: 'longitude',
              type: 'number',
              admin: {
                step: 0.000001,
                description: 'Longitude coordinate',
              },
            },
          ],
          admin: {
            description: 'GPS location - Pin your exact location on the map',
          },
        },
      ],
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        {
          name: 'currency',
          type: 'select',
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
        },
        {
          name: 'newsletter',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'cart',
      type: 'json',
      access: {
        // Cart is managed via API endpoints only, not through admin UI
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers/superadmins
        condition: (data, siblingData, { user }) => {
          return isSuperAdminOrDeveloper(user)
        },
        description: 'Shopping cart data (managed via API, JSON format)',
      },
    },
    {
      name: 'wishlist',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Products added to wishlist',
      },
    },
    {
      name: 'recentlyViewed',
      type: 'array',
      access: {
        // Managed via API endpoints only, not through admin UI
        update: nobody,
      },
      admin: {
        readOnly: true,
        description: 'Recently viewed products (managed via API, max 20 items)',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'viewedAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
    },
  ],
}
