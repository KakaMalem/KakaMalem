import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Contact: GlobalConfig = {
  slug: 'contact',
  admin: {
    hidden: ({ user }) => {
      // Only show to developers and superadmins
      return !(user?.roles?.includes('developer') || user?.roles?.includes('superadmin'))
    },
    group: 'CMS',
  },
  access: {
    // Anyone can read contact info
    read: () => true,
    // Only admins can update contact info
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'تماس با ما',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'ایمیل',
      },
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: {
        description: 'شماره تماس',
      },
    },
    {
      name: 'whatsapp',
      type: 'text',
      admin: {
        description: 'شماره واتساپ (اختیاری)',
      },
    },
    {
      name: 'address',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
