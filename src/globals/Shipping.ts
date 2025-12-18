import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Shipping: GlobalConfig = {
  slug: 'shipping',
  admin: {
    hidden: ({ user }) => {
      // Only show to developers and superadmins
      return !(user?.roles?.includes('developer') || user?.roles?.includes('superadmin'))
    },
    group: 'CMS',
  },
  access: {
    // Anyone can read shipping info
    read: () => true,
    // Only admins can update shipping info
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'ارسال و بازگشت',
      admin: {
        description: 'عنوان که در بالای صفحه نمایش داده می‌شود',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'اطلاعات کامل ارسال و بازگشت کالا',
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
