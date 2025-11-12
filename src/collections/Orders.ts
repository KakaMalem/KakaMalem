import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'total', 'status', 'createdAt'],
    group: 'E-commerce',
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data.orderNumber) {
          data.orderNumber = `ORD-${Date.now()}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'product',
              type: 'relationship',
              relationTo: 'products',
              required: true,
              admin: {
                width: '40%',
              },
            },
            {
              name: 'quantity',
              type: 'number',
              required: true,
              min: 1,
              admin: {
                width: '20%',
              },
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              admin: {
                width: '20%',
              },
            },
            {
              name: 'total',
              type: 'number',
              required: true,
              admin: {
                width: '20%',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subtotal',
          type: 'number',
          required: true,
          admin: {
            width: '25%',
          },
        },
        {
          name: 'shipping',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '25%',
          },
        },
        {
          name: 'total',
          type: 'number',
          required: true,
          admin: {
            width: '25%',
          },
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'firstName',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'lastName',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'address1',
          type: 'text',
          required: true,
        },
        {
          name: 'address2',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              required: true,
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
              name: 'country',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'phone',
              type: 'text',
              admin: {
                width: '50%',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'trackingNumber',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Processing',
          value: 'processing',
        },
        {
          label: 'Shipped',
          value: 'shipped',
        },
        {
          label: 'Delivered',
          value: 'delivered',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Paid',
          value: 'paid',
        },
        {
          label: 'Failed',
          value: 'failed',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        {
          label: 'Cash on Delivery',
          value: 'cod',
        },
        {
          label: 'Bank Transfer',
          value: 'bank_transfer',
        },
        {
          label: 'Credit Card',
          value: 'credit_card',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'AF',
      options: [
        {
          label: 'AF',
          value: 'AF',
        },
        {
          label: 'USD',
          value: 'USD',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
