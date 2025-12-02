import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const Terms: GlobalConfig = {
  slug: 'terms',
  admin: {
    hidden: ({ user }) => {
      // Only show to admins and superadmins
      return !(user?.roles?.includes('admin') || user?.roles?.includes('superadmin'))
    },
  },
  access: {
    // Anyone can read terms
    read: () => true,
    // Only admins can update terms
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Terms and Conditions',
      admin: {
        description: 'The title that appears at the top of the page',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The full terms and conditions content',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        description: 'Date when terms were last updated',
        position: 'sidebar',
      },
    },
  ],
}
