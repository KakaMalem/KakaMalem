import type { CollectionConfig } from 'payload'
import { isSuperAdminOrDeveloper } from '../access/isSuperAdminOrDeveloper'
import { createIsAdminOrSellerOwner } from '../access/isAdminOrSellerOwner'

// Allow any authenticated user to upload media (needed for profile pictures)
const isAuthenticated = ({ req: { user } }: { req: { user: unknown } }) => !!user

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Anyone can read media files (needed for product images on frontend)
    read: () => true,
    // Any authenticated user can upload media (for profile pictures, product images, etc.)
    create: isAuthenticated,
    // Admins and developers can update any media, sellers can only update their own
    update: createIsAdminOrSellerOwner('uploadedBy'),
    // Admins and developers can delete any media, sellers can only delete their own
    delete: createIsAdminOrSellerOwner('uploadedBy'),
  },
  admin: {
    // Hide from sidebar for all users except developers/superadmins
    hidden: ({ user }) => {
      return !isSuperAdminOrDeveloper(user)
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false,
      admin: {
        description: 'Leave blank to auto-generate from filename',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      // Auto-populate with current user
      defaultValue: ({ user }) => user?.id,
      // Admins and developers can see who uploaded, sellers only see their own
      admin: {
        readOnly: true,
        condition: (data, siblingData, { user }) => {
          return isSuperAdminOrDeveloper(user) || !!user?.roles?.includes('admin')
        },
      },
    },
  ],
  upload: true,
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        // Auto-set uploadedBy on creation
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
        }

        // Auto-generate alt text from filename if not provided
        if (!data.alt && data.filename) {
          // Remove file extension and replace dashes/underscores with spaces
          const nameWithoutExt = data.filename.replace(/\.[^/.]+$/, '')
          const humanReadable = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
          // Capitalize first letter
          data.alt = humanReadable.charAt(0).toUpperCase() + humanReadable.slice(1)
        }

        return data
      },
    ],
  },
}
