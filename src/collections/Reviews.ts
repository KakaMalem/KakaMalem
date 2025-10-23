import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'product', 'rating', 'user', 'status', 'createdAt'],
    group: 'E-commerce',
  },
  access: {
    // Anyone can read approved reviews
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) {
        return true
      }
      return {
        status: { equals: 'approved' },
      }
    },
    // Only authenticated users can create reviews
    create: ({ req: { user } }) => !!user,
    // Users can update their own reviews, admins can update any
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) {
        return true
      }
      return {
        user: { equals: user?.id },
      }
    },
    // Only admins can delete reviews
    delete: ({ req: { user } }) => user?.roles?.includes('admin') || false,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // After creating or updating a review, recalculate product stats
        if (doc.product && doc.status === 'approved') {
          try {
            const { payload } = req

            // Fetch all approved reviews for this product
            const reviews = await payload.find({
              collection: 'reviews',
              where: {
                product: { equals: doc.product },
                status: { equals: 'approved' },
              },
              limit: 1000,
            })

            const reviewDocs = reviews.docs

            if (reviewDocs.length > 0) {
              const totalRating = reviewDocs.reduce(
                (sum: number, review: any) => sum + review.rating,
                0,
              )
              const averageRating = totalRating / reviewDocs.length

              // Update product with new stats
              await payload.update({
                collection: 'products',
                id: doc.product,
                data: {
                  averageRating: Math.round(averageRating * 10) / 10,
                  reviewCount: reviewDocs.length,
                },
              })
            }
          } catch (error) {
            console.error('Failed to update product review stats:', error)
          }
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // After deleting a review, recalculate product stats
        if (doc.product) {
          try {
            const { payload } = req

            const reviews = await payload.find({
              collection: 'reviews',
              where: {
                product: { equals: doc.product },
                status: { equals: 'approved' },
              },
              limit: 1000,
            })

            const reviewDocs = reviews.docs

            if (reviewDocs.length > 0) {
              const totalRating = reviewDocs.reduce(
                (sum: number, review: any) => sum + review.rating,
                0,
              )
              const averageRating = totalRating / reviewDocs.length

              await payload.update({
                collection: 'products',
                id: doc.product,
                data: {
                  averageRating: Math.round(averageRating * 10) / 10,
                  reviewCount: reviewDocs.length,
                },
              })
            } else {
              // No reviews left, reset stats
              await payload.update({
                collection: 'products',
                id: doc.product,
                data: {
                  averageRating: 0,
                  reviewCount: 0,
                },
              })
            }
          } catch (error) {
            console.error('Failed to update product review stats after deletion:', error)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            // Auto-set the user to the currently logged-in user
            if (req.user && !value) {
              return req.user.id
            }
            return value
          },
        ],
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        description: 'Rating from 1 to 5 stars',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 100,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'verifiedPurchase',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'User purchased this product',
      },
    },
    {
      name: 'helpful',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Number of users who found this helpful',
        readOnly: true,
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'adminResponse',
      type: 'group',
      fields: [
        {
          name: 'response',
          type: 'textarea',
          maxLength: 1000,
        },
        {
          name: 'respondedAt',
          type: 'date',
          admin: {
            readOnly: true,
          },
        },
      ],
    },
  ],
}
