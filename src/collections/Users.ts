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
    // Password reset functionality
    forgotPassword: {
      generateEmailHTML: (args) => {
        const { token, user } = args || {}
        const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/reset-password?token=${token}`
        const firstName = (user as { firstName?: string }).firstName || 'کاربر'

        return `
          <!DOCTYPE html>
          <html dir="rtl" lang="fa">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; direction: rtl;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;" dir="rtl">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" dir="rtl">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">کاکا معلم</h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px; text-align: right;" dir="rtl">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; text-align: right;">سلام ${firstName} عزیز،</h2>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
                          درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد. برای تنظیم رمز عبور جدید روی دکمه زیر کلیک کنید.
                        </p>

                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;" dir="rtl">
                          <tr>
                            <td style="background-color: #dc2626; border-radius: 8px;">
                              <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                                تنظیم رمز عبور جدید
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: right;">
                          اگر دکمه بالا کار نمی‌کند، لینک زیر را در مرورگر خود کپی و جایگذاری کنید:
                        </p>
                        <p style="color: #dc2626; font-size: 14px; word-break: break-all; margin: 10px 0 0 0; text-align: left; direction: ltr;">
                          <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
                        </p>

                        <p style="color: #9ca3af; font-size: 13px; margin: 30px 0 0 0; text-align: right;">
                          این لینک تا ۱ ساعت معتبر است.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید. رمز عبور شما تغییر نخواهد کرد.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      },
      generateEmailSubject: () => 'بازیابی رمز عبور - کاکا معلم',
    },
    // Email verification for password-based users (OAuth users are auto-verified)
    verify: {
      generateEmailHTML: ({ token, user }) => {
        const verificationUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/auth/verify-email?token=${token}`
        const firstName = (user as { firstName?: string }).firstName || 'کاربر'

        return `
          <!DOCTYPE html>
          <html dir="rtl" lang="fa">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; direction: rtl;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f5f5f5;" dir="rtl">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" dir="rtl">
                    <!-- Header -->
                    <tr>
                      <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">کاکا معلم</h1>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px; text-align: right;" dir="rtl">
                        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; text-align: right;">سلام ${firstName} عزیز،</h2>

                        <p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0; text-align: right;">
                          از ثبت‌نام شما در کاکا معلم متشکریم! لطفاً برای تأیید ایمیل آدرس خود روی دکمه زیر کلیک کنید.
                        </p>

                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;" dir="rtl">
                          <tr>
                            <td style="background-color: #dc2626; border-radius: 8px;">
                              <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">
                                تأیید ایمیل
                              </a>
                            </td>
                          </tr>
                        </table>

                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: right;">
                          اگر دکمه بالا کار نمی‌کند، لینک زیر را در مرورگر خود کپی و جایگذاری کنید:
                        </p>
                        <p style="color: #dc2626; font-size: 14px; word-break: break-all; margin: 10px 0 0 0; text-align: left; direction: ltr;">
                          <a href="${verificationUrl}" style="color: #dc2626;">${verificationUrl}</a>
                        </p>

                        <p style="color: #9ca3af; font-size: 13px; margin: 30px 0 0 0; text-align: right;">
                          این لینک تا ۲۴ ساعت معتبر است.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          اگر شما این درخواست را نداده‌اید، لطفاً این ایمیل را نادیده بگیرید.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      },
      generateEmailSubject: () => 'تأیید ایمیل - کاکا معلم',
    },
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
      name: 'authMethods',
      type: 'select',
      hasMany: true,
      defaultValue: [],
      options: [
        { label: 'Password', value: 'password' },
        { label: 'Google', value: 'google' },
      ],
      access: {
        // System-managed field, no manual updates
        create: nobody,
        update: nobody,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Available authentication methods (system-managed)',
      },
    },
    {
      name: 'googleSub',
      type: 'text',
      access: {
        // OAuth field - system managed, no manual updates
        create: nobody,
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
        description: 'Google OAuth subject ID (system-managed)',
      },
      index: true,
    },
    {
      name: 'picture',
      type: 'text',
      access: {
        // OAuth field - system managed, no manual updates
        create: nobody,
        update: nobody,
      },
      admin: {
        readOnly: true,
        // Hidden from non-developers
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
        description: 'Profile picture URL (system-managed)',
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
    /**
     * LAST LOGIN TRACKING
     * Updated automatically via afterLogin hook
     */
    {
      name: 'lastLoginAt',
      type: 'date',
      access: {
        create: nobody,
        update: nobody,
      },
      admin: {
        readOnly: true,
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Last successful login time',
      },
    },
    /**
     * LOCATION MAP (UI Component)
     * Visual map display of user's current location
     */
    {
      name: 'locationMap',
      type: 'ui',
      admin: {
        position: 'sidebar',
        condition: (data, siblingData, { user }) => {
          // Only show if user has location data and viewer is admin+
          const hasLocation = data?.location?.coordinates?.[0] && data?.location?.coordinates?.[1]
          const isAuthorized = !!(
            user?.roles?.includes('developer') ||
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin')
          )
          return hasLocation && isAuthorized
        },
        components: {
          Field: '@/fields/userLocationMap#UserLocationMapField',
        },
      },
    },
    /**
     * LOCATION TRACKING
     * Automatically captured on login/registration via IP geolocation
     * Can be enhanced with browser geolocation if user grants permission
     * System-managed fields - no manual updates allowed
     */
    {
      name: 'location',
      type: 'group',
      access: {
        // System-managed field, no manual updates from frontend
        create: nobody,
        update: nobody,
      },
      admin: {
        // Only show to developers and admins
        condition: (data, siblingData, { user }) => {
          return !!(
            user?.roles?.includes('developer') ||
            user?.roles?.includes('admin') ||
            user?.roles?.includes('superadmin')
          )
        },
      },
      fields: [
        {
          name: 'coordinates',
          type: 'point',
          admin: {
            description: 'Geographic coordinates [longitude, latitude]',
          },
        },
        {
          name: 'accuracy',
          type: 'number',
          admin: {
            description: 'Location accuracy in meters (from browser GPS)',
          },
        },
        {
          name: 'country',
          type: 'text',
          admin: {
            description: 'Country name (e.g., Afghanistan)',
          },
        },
        {
          name: 'countryCode',
          type: 'text',
          admin: {
            description: 'ISO 3166-1 alpha-2 country code (e.g., AF)',
          },
        },
        {
          name: 'region',
          type: 'text',
          admin: {
            description: 'Region/Province/State (e.g., Kabul)',
          },
        },
        {
          name: 'city',
          type: 'text',
          admin: {
            description: 'City name',
          },
        },
        {
          name: 'timezone',
          type: 'text',
          admin: {
            description: 'IANA timezone (e.g., Asia/Kabul)',
          },
        },
        {
          name: 'source',
          type: 'select',
          options: [
            { label: 'Browser GPS', value: 'browser' },
            { label: 'IP Geolocation', value: 'ip' },
            { label: 'Manual Entry', value: 'manual' },
          ],
          admin: {
            description: 'How location was obtained',
          },
        },
        {
          name: 'event',
          type: 'select',
          options: [
            { label: 'Login', value: 'login' },
            { label: 'Registration', value: 'register' },
            { label: 'Order', value: 'order' },
            { label: 'Browser Permission', value: 'browser_permission' },
            { label: 'Email Verification', value: 'verify_email' },
            { label: 'OAuth Login', value: 'oauth' },
          ],
          admin: {
            description: 'What event triggered this location capture',
          },
        },
        {
          name: 'ip',
          type: 'text',
          admin: {
            description: 'IP address used for geolocation',
          },
        },
        {
          name: 'permissionGranted',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Whether user granted browser location permission',
          },
        },
        {
          name: 'lastUpdated',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'When location was last captured',
          },
        },
      ],
    },
    /**
     * LOCATION HISTORY
     * Keeps track of last 10 location entries for analytics
     * Hidden from admin panel, accessible via API for developers only
     */
    {
      name: 'locationHistory',
      type: 'array',
      maxRows: 10,
      access: {
        create: nobody,
        update: nobody,
      },
      admin: {
        description: 'Historical location data (last 10 entries)',
        condition: (data, siblingData, { user }) => {
          return !!user?.roles?.includes('developer')
        },
      },
      fields: [
        {
          name: 'coordinates',
          type: 'point',
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'country',
          type: 'text',
        },
        {
          name: 'source',
          type: 'select',
          options: [
            { label: 'Browser', value: 'browser' },
            { label: 'IP', value: 'ip' },
          ],
        },
        {
          name: 'event',
          type: 'select',
          options: [
            { label: 'Login', value: 'login' },
            { label: 'Registration', value: 'register' },
            { label: 'Order', value: 'order' },
            { label: 'Browser Permission', value: 'browser_permission' },
            { label: 'Email Verification', value: 'verify_email' },
            { label: 'OAuth Login', value: 'oauth' },
          ],
        },
        {
          name: 'timestamp',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
  hooks: {
    afterLogin: [
      async ({ user, req }) => {
        // Update lastLoginAt timestamp
        try {
          await req.payload.update({
            collection: 'users',
            id: user.id,
            data: {
              lastLoginAt: new Date().toISOString(),
            },
            overrideAccess: true,
          })
        } catch (error) {
          console.error('Failed to update lastLoginAt:', error)
        }
        return user
      },
    ],
  },
}
