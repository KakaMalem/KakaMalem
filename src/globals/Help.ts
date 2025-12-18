import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Help: GlobalConfig = {
  slug: 'help',
  admin: {
    hidden: ({ user }) => {
      // Only show to developers and superadmins
      return !(user?.roles?.includes('developer') || user?.roles?.includes('superadmin'))
    },
    group: 'CMS',
  },
  access: {
    // Anyone can read help content
    read: () => true,
    // Only admins can update help content
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'مرکز راهنمایی',
      admin: {
        description: 'عنوان که در بالای صفحه نمایش داده می‌شود',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'محتوای کامل مرکز راهنمایی',
      },
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
