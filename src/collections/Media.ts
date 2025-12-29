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
  endpoints: [
    {
      path: '/filtered',
      method: 'get',
      handler: async (req) => {
        const { user, payload } = req

        // If no user, return empty
        if (!user) {
          return Response.json({
            docs: [],
            totalDocs: 0,
            limit: 0,
            totalPages: 0,
            page: 1,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNextPage: false,
          })
        }

        // Admins and developers see all media
        if (
          user.roles?.includes('admin') ||
          user.roles?.includes('superadmin') ||
          user.roles?.includes('developer')
        ) {
          const result = await payload.find({
            collection: 'media',
            limit: parseInt(req.query.limit as string) || 24,
            page: parseInt(req.query.page as string) || 1,
            sort: (req.query.sort as string) || '-createdAt',
            where: req.query.where ? JSON.parse(req.query.where as string) : undefined,
          })
          return Response.json(result)
        }

        // Sellers only see their storefront's media
        if (user.roles?.includes('seller') || user.roles?.includes('storefront_owner')) {
          // Find the seller's storefront
          const storefronts = await payload.find({
            collection: 'storefronts',
            where: {
              seller: {
                equals: user.id,
              },
            },
            limit: 1,
          })

          const storefrontId = storefronts.docs[0]?.id

          if (!storefrontId) {
            // No storefront, return empty
            return Response.json({
              docs: [],
              totalDocs: 0,
              limit: 0,
              totalPages: 0,
              page: 1,
              pagingCounter: 1,
              hasPrevPage: false,
              hasNextPage: false,
            })
          }

          // Get media filtered by storefront
          const result = await payload.find({
            collection: 'media',
            limit: parseInt(req.query.limit as string) || 24,
            page: parseInt(req.query.page as string) || 1,
            sort: (req.query.sort as string) || '-createdAt',
            where: {
              storefront: {
                equals: storefrontId,
              },
            },
          })
          return Response.json(result)
        }

        // Other authenticated users see their own uploaded media
        const result = await payload.find({
          collection: 'media',
          limit: parseInt(req.query.limit as string) || 24,
          page: parseInt(req.query.page as string) || 1,
          sort: (req.query.sort as string) || '-createdAt',
          where: {
            uploadedBy: {
              equals: user.id,
            },
          },
        })
        return Response.json(result)
      },
    },
  ],
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
    {
      name: 'storefront',
      type: 'relationship',
      relationTo: 'storefronts',
      required: false,
      admin: {
        readOnly: true,
        description: "Auto-populated from seller's storefront",
        condition: (data, siblingData, { user }) => {
          // Only show to admins, developers, and superadmins
          return isSuperAdminOrDeveloper(user) || !!user?.roles?.includes('admin')
        },
      },
    },
  ],
  upload: true,
  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        // Auto-set uploadedBy on creation
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id

          // Auto-populate storefront for sellers
          if (req.user.roles?.includes('seller') || req.user.roles?.includes('storefront_owner')) {
            try {
              const storefronts = await req.payload.find({
                collection: 'storefronts',
                where: {
                  seller: {
                    equals: req.user.id,
                  },
                },
                limit: 1,
              })

              if (storefronts.docs[0]?.id) {
                data.storefront = storefronts.docs[0].id
              }
            } catch (error) {
              console.error('Error auto-populating storefront for media:', error)
            }
          }
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
