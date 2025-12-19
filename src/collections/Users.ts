import type { CollectionConfig } from 'payload'
import { isAdminOrSelf } from '../access/isAdminOrSelf'
import { isDeveloperField } from '../access/isDeveloper'
import {
  isSuperAdminOrDeveloper,
  isSuperAdminOrDeveloperField,
} from '../access/isSuperAdminOrDeveloper'
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
     * - Admins: Can delete any user
     * - Users: Can delete their own account
     */
    delete: isAdminOrSelf,
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days (when "remember me" is checked)
    cookies: {
      sameSite: 'Lax',
      // Allow HTTP cookies for local network access (192.168.x.x, localhost)
      // Only enforce secure cookies in production on public domains
      secure: false, // Let individual endpoints handle security based on host
    },
    // verify: false, // Disable email verification for OAuth users
  },
  fields: [
    /**
     * PASSWORD FIELD ACCESS CONTROL
     * Override the default auth password field to restrict access
     * - Users can change their own password via the "Change Password" button
     * - Developers can change any user's password (for account recovery/support)
     * - Field is hidden from admin panel for non-developers
     */
    {
      name: 'password',
      type: 'text',
      access: {
        update: ({ req: { user }, id }) => {
          if (!user) return false
          // Users can change their own password
          if (user.id === id) return true
          // Only developers can change other users' passwords
          return !!user.roles?.includes('developer')
        },
      },
      admin: {
        // Hidden from admin panel for everyone - use "Change Password" button or API
        hidden: true,
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
      name: 'sub',
      type: 'text',
      access: {
        // OAuth field - system managed, no manual updates
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
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
        // Hidden from non-developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
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
        // Hidden from non-developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
        description: 'Indicates if user has set a custom password (system-managed)',
      },
    },
    {
      name: 'ogfan',
      type: 'checkbox',
      defaultValue: false,
      access: {
        // Only developers can create/update this field (super exclusive!)
        create: isDeveloperField,
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
      name: 'phone',
      type: 'text',
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
          label: 'Super Admin',
          value: 'superadmin',
        },
        {
          label: 'Developer',
          value: 'developer',
        },
      ],
      admin: {
        position: 'sidebar',
        description:
          'User roles determine access levels. Only superadmins and developers can modify roles.',
        /**
         * VISIBILITY CONDITION
         * - First user creation (no user logged in): Show field to set initial developer role
         * - Superadmins/Developers: Can see and manage roles
         * - Everyone else: Cannot see this field at all
         */
        condition: (data, siblingData, { user }) => {
          // First user creation - show to set up initial developer account
          if (!user) return true
          // Only superadmins and developers can see/manage roles
          return isSuperAdminOrDeveloper(user)
        },
      },
      access: {
        /**
         * ROLES FIELD ACCESS CONTROL
         * - Only superadmins and developers can assign or modify roles
         * - Regular admins cannot manage roles (prevents privilege escalation)
         * - Default role (customer) is applied automatically for new registrations
         */
        create: isSuperAdminOrDeveloperField,
        update: isSuperAdminOrDeveloperField,
      },
      hooks: {
        beforeChange: [
          ({ req, value, data, operation }) => {
            // Define valid roles and privilege hierarchy
            const VALID_ROLES = ['customer', 'seller', 'admin', 'superadmin', 'developer']
            // Elevated roles that only superadmin/developer can assign
            const ELEVATED_ROLES = ['admin', 'superadmin']
            // Developer role is exclusive - only developers can assign it
            const DEVELOPER_ONLY_ROLE = 'developer'

            // Ensure value is always an array
            let roles = Array.isArray(value) ? value : []

            // Validate all roles are from the allowed list
            roles = roles.filter((role: string) => VALID_ROLES.includes(role))

            // FIRST USER CREATION: Allow all roles when no user is logged in
            // This enables setting up the initial developer/superadmin account
            if (!req.user) {
              if (roles.length === 0) {
                roles = ['customer']
              }
              return roles
            }

            // Check current user's privileges
            const userIsDeveloper = req.user.roles?.includes('developer')
            const userIsSuperAdmin = req.user.roles?.includes('superadmin')
            const userIsSuperAdminOrDeveloper = userIsSuperAdmin || userIsDeveloper

            // PREVENT SELF-DEMOTION: Users cannot remove their own elevated roles
            // This prevents accidental lockout from the system
            if (operation === 'update' && data?.id === req.user.id && userIsSuperAdminOrDeveloper) {
              const currentUserRoles = (req.user.roles || []) as string[]
              // Preserve elevated roles
              ELEVATED_ROLES.forEach((elevatedRole) => {
                if (currentUserRoles.includes(elevatedRole) && !roles.includes(elevatedRole)) {
                  roles.push(elevatedRole)
                }
              })
              // Preserve developer role if user is a developer
              if (
                currentUserRoles.includes(DEVELOPER_ONLY_ROLE) &&
                !roles.includes(DEVELOPER_ONLY_ROLE)
              ) {
                roles.push(DEVELOPER_ONLY_ROLE)
              }
            }

            // DEVELOPER ROLE RESTRICTION: Only developers can assign the developer role
            if (!userIsDeveloper && roles.includes(DEVELOPER_ONLY_ROLE)) {
              roles = roles.filter((role: string) => role !== DEVELOPER_ONLY_ROLE)
            }

            // ELEVATED ROLE RESTRICTION: Only superadmin/developer can assign elevated roles
            if (!userIsSuperAdminOrDeveloper) {
              roles = roles.filter((role: string) => !ELEVATED_ROLES.includes(role))
            }

            // Ensure at least 'customer' role is always present
            if (roles.length === 0) {
              roles = ['customer']
            }

            return roles
          },
        ],
      },
    },
    {
      name: 'addresses',
      type: 'array',
      admin: {
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
      },
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
            {
              name: 'accuracy',
              type: 'number',
              admin: {
                step: 0.01,
                description: 'Location accuracy in meters',
              },
            },
            {
              name: 'source',
              type: 'select',
              options: [
                { label: 'GPS', value: 'gps' },
                { label: 'IP Address', value: 'ip' },
                { label: 'Manual Entry', value: 'manual' },
                { label: 'Map Selection', value: 'map' },
              ],
              admin: {
                description: 'How the location was obtained',
              },
            },
            {
              name: 'ip',
              type: 'text',
              admin: {
                description: 'IP address when location was captured',
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
      admin: {
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
      },
      fields: [
        {
          name: 'currency',
          type: 'select',
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
        // Hidden from non-developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
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
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
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
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
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
      admin: {
        // Only show to developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
      },
    },
  ],
}
