import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'roles'],
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
      admin: {
        hidden: true,
      },
      index: true,
    },
    {
      name: 'picture',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'hasPassword',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: 'Indicates if user has set a custom password (auto-managed)',
      },
    },
    {
      name: 'ogfan',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Original Fan - Early supporter badge',
        position: 'sidebar',
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
          label: 'Admin',
          value: 'admin',
        },
      ],
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
          defaultValue: 'USD',
          options: [
            {
              label: 'USD',
              value: 'USD',
            },
            {
              label: 'AF',
              value: 'AF',
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
      admin: {
        hidden: true,
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
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
    },
  ],
}
