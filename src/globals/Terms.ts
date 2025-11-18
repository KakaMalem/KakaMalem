import type { GlobalConfig } from 'payload'

export const Terms: GlobalConfig = {
  slug: 'terms',
  access: {
    read: () => true, // Anyone can read
    update: ({ req: { user } }) => {
      // Only admins can update
      return user?.roles?.includes('admin') ?? false
    },
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
