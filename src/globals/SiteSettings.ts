import type { GlobalConfig } from 'payload'
import { isDeveloper } from '../access/isDeveloper'
import { nobody } from '@/access/nobody'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
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
          label: 'Delivery',
          fields: [
            {
              name: 'freeDeliveryEnabled',
              label: 'Enable Free Delivery',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'freeDeliveryThreshold',
              label: 'Free Delivery Threshold (AFN)',
              type: 'number',
              defaultValue: 1000,
              min: 0,
              admin: {
                description: 'Orders above this amount qualify for free delivery',
                condition: (_, siblingData) => siblingData?.freeDeliveryEnabled,
              },
            },
            {
              name: 'freeDeliveryCurrency',
              label: 'Currency',
              type: 'select',
              defaultValue: 'AFN',
              options: [
                { label: 'افغانی (؋)', value: 'AFN' },
                { label: 'دالر ($)', value: 'USD' },
              ],
              admin: {
                condition: (_, siblingData) => siblingData?.freeDeliveryEnabled,
              },
              access: {
                update: nobody,
              },
            },
            {
              name: 'freeDeliveryBadgeText',
              label: 'Badge Text',
              type: 'text',
              defaultValue: 'ارسال رایگان',
              admin: {
                description: 'Text shown in the free delivery badge',
                condition: (_, siblingData) => siblingData?.freeDeliveryEnabled,
              },
            },
            {
              name: 'shippingCost',
              label: 'Shipping Cost (AFN)',
              type: 'number',
              defaultValue: 50,
              min: 0,
              admin: {
                description: 'Shipping cost charged when free delivery is disabled',
                condition: (_, siblingData) => !siblingData?.freeDeliveryEnabled,
              },
            },
          ],
        },
      ],
    },
  ],
}
