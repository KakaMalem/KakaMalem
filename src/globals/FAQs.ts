import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const FAQs: GlobalConfig = {
  slug: 'faqs',
  admin: {
    hidden: ({ user }) => {
      // Only show to developers and superadmins
      return !(user?.roles?.includes('developer') || user?.roles?.includes('superadmin'))
    },
    group: 'CMS',
  },
  access: {
    // Anyone can read FAQs
    read: () => true,
    // Only admins can update FAQs
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'سوالات متداول',
      admin: {
        description: 'عنوان که در بالای صفحه نمایش داده می‌شود',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: {
        description: 'لیست سوالات متداول',
      },
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          admin: {
            description: 'سوال',
          },
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
          admin: {
            description: 'پاسخ به سوال',
          },
        },
      ],
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        description: 'تاریخ آخرین بروزرسانی',
        position: 'sidebar',
      },
    },
  ],
}
