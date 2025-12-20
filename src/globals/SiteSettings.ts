import type { GlobalConfig } from 'payload'
import { isDeveloper } from '../access/isDeveloper'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Settings',
    hidden: ({ user }) => !user?.roles?.includes('developer'),
  },
  access: {
    read: () => true,
    update: isDeveloper,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Shipping',
          description: 'Configure how shipping fees are calculated',
          fields: [
            {
              name: 'shippingMode',
              label: 'Shipping Mode',
              type: 'radio',
              defaultValue: 'free_above_threshold',
              options: [
                {
                  label: 'Always Free — No shipping fee for any order',
                  value: 'always_free',
                },
                {
                  label: 'Free Above Threshold — Free shipping for orders above a minimum amount',
                  value: 'free_above_threshold',
                },
                {
                  label: 'Always Charged — Shipping fee for all orders',
                  value: 'always_charged',
                },
              ],
              admin: {
                layout: 'vertical',
              },
            },
            // Shipping Cost - shown when not always free
            {
              name: 'shippingCost',
              label: 'Shipping Fee (AFN)',
              type: 'number',
              defaultValue: 50,
              min: 0,
              required: true,
              admin: {
                description: 'The shipping fee charged to customers',
                condition: (data) => data?.shippingMode !== 'always_free',
              },
            },
            // Free Delivery Threshold - only shown for threshold mode
            {
              name: 'freeDeliveryThreshold',
              label: 'Free Delivery Threshold (AFN)',
              type: 'number',
              defaultValue: 1000,
              min: 0,
              required: true,
              admin: {
                description: 'Orders above this amount qualify for free delivery',
                condition: (data) => data?.shippingMode === 'free_above_threshold',
              },
            },
          ],
        },
      ],
    },
  ],
}
