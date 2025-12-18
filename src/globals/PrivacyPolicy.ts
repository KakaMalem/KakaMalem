import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const PrivacyPolicy: GlobalConfig = {
  slug: 'privacy-policy',
  admin: {
    hidden: ({ user }) => {
      // Only show to developers and superadmins
      return !(user?.roles?.includes('developer') || user?.roles?.includes('superadmin'))
    },
    group: 'CMS',
  },
  access: {
    // Anyone can read privacy policy
    read: () => true,
    // Only admins can update privacy policy
    update: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Privacy Policy',
      admin: {
        description: 'The title that appears at the top of the page',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'The full privacy policy content',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        description: 'Date when privacy policy was last updated',
        position: 'sidebar',
      },
    },
  ],
}
