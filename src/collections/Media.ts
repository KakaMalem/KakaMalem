import type { CollectionConfig } from 'payload'
import { isAdminOrSeller } from '../access/isAdminOrSeller'
import { isSuperAdminOrDeveloper } from '../access/isSuperAdminOrDeveloper'
import { createIsAdminOrSellerOwner } from '../access/isAdminOrSellerOwner'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Anyone can read media files (needed for product images on frontend)
    read: () => true,
    // Admins and sellers can upload media
    create: isAdminOrSeller,
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
      required: true,
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
  // Hook to automatically set uploadedBy on creation
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
        }
        return data
      },
    ],
  },
}
