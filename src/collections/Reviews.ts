import type { CollectionConfig } from 'payload'
import type { Review } from '@/payload-types'
import { isAdminField } from '../access/isAdmin'
import { isAdminOrDeveloper } from '../access/isAdminOrDeveloper'
import { isLoggedIn } from '../access/isLoggedIn'
import { nobody } from '../access/nobody'
import { verifyPurchaseHook } from '../hooks/verifyPurchase'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'product', 'rating', 'user', 'status', 'createdAt'],
    group: 'E-commerce',
  },
  access: {
    /**
     * READ ACCESS
     * - Admins/Developers: Can read all reviews (including pending/rejected)
     * - Public: Can only read approved reviews
     * - Ensures review moderation
     */
    read: ({ req: { user } }) => {
      // Technical staff can read all reviews
      if (
        user?.roles?.includes('admin') ||
        user?.roles?.includes('superadmin') ||
        user?.roles?.includes('developer')
      ) {
        return true
      }
      // Public can only read approved reviews
      return {
        status: {
          equals: 'approved',
        },
      }
    },
    /**
     * CREATE ACCESS
     * - Only authenticated users can create reviews
     * - Prevents spam and fake reviews
     */
    create: isLoggedIn,
    /**
     * UPDATE ACCESS
     * - Admins/Developers: Can update any review
     * - Users: Can only update their own reviews
     * - Customers cannot edit after admin moderation
     */
    update: ({ req: { user } }) => {
      if (!user) return false
      // Technical staff can update any review
      if (
        user.roles?.includes('admin') ||
        user.roles?.includes('superadmin') ||
        user.roles?.includes('developer')
      ) {
        return true
      }
      // Users can only update their own reviews
      return {
        user: { equals: user.id },
      }
    },
    /**
     * DELETE ACCESS
     * - Only admins and developers can delete reviews
     * - Prevents users from removing negative reviews
     * - Maintains review integrity
     */
    delete: isAdminOrDeveloper,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation: _operation }) => {
        // After creating or updating a review, recalculate product stats
        if (doc.product) {
          try {
            const { payload } = req

            // Extract product ID (handle both string and populated object)
            const productId = typeof doc.product === 'string' ? doc.product : doc.product.id

            // Fetch only approved reviews for this product
            const reviews = await payload.find({
              collection: 'reviews',
              where: {
                and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
              },
              limit: 1000,
            })

            const reviewDocs = reviews.docs

            if (reviewDocs.length > 0) {
              const totalRating = reviewDocs.reduce(
                (sum: number, review: Review) => sum + review.rating,
                0,
              )
              const averageRating = totalRating / reviewDocs.length

              // Update product with new stats
              await payload.update({
                collection: 'products',
                id: productId,
                data: {
                  averageRating: Math.round(averageRating * 10) / 10,
                  reviewCount: reviewDocs.length,
                },
              })
            } else {
              // No approved reviews, reset stats
              await payload.update({
                collection: 'products',
                id: productId,
                data: {
                  averageRating: 0,
                  reviewCount: 0,
                },
              })
            }
          } catch (_error) {
            console.error('Failed to update product review stats:', _error)
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

            // Extract product ID (handle both string and populated object)
            const productId = typeof doc.product === 'string' ? doc.product : doc.product.id

            // Fetch only approved reviews for this product
            const reviews = await payload.find({
              collection: 'reviews',
              where: {
                and: [{ product: { equals: productId } }, { status: { equals: 'approved' } }],
              },
              limit: 1000,
            })

            const reviewDocs = reviews.docs

            if (reviewDocs.length > 0) {
              const totalRating = reviewDocs.reduce(
                (sum: number, review: Review) => sum + review.rating,
                0,
              )
              const averageRating = totalRating / reviewDocs.length

              await payload.update({
                collection: 'products',
                id: productId,
                data: {
                  averageRating: Math.round(averageRating * 10) / 10,
                  reviewCount: reviewDocs.length,
                },
              })
            } else {
              // No approved reviews left, reset stats
              await payload.update({
                collection: 'products',
                id: productId,
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
      access: {
        // User field is auto-populated, prevent manual updates
        update: nobody,
      },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-populated with current user',
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
      defaultValue: 'approved',
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
      access: {
        // Only admins and developers can change review status (moderation)
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
        description: 'Review moderation status (admins only)',
      },
    },
    {
      name: 'verifiedPurchase',
      type: 'checkbox',
      defaultValue: false,
      access: {
        // System-managed field, auto-verified based on purchase history
        update: nobody,
      },
      admin: {
        position: 'sidebar',
        description: 'User purchased this product (auto-verified)',
        readOnly: true,
      },
      hooks: {
        beforeChange: [verifyPurchaseHook],
      },
    },
    {
      name: 'helpful',
      type: 'number',
      defaultValue: 0,
      access: {
        // System-managed field, calculated from votes
        update: nobody,
      },
      admin: {
        position: 'sidebar',
        description: 'Number of users who found this helpful (auto-calculated)',
        readOnly: true,
      },
    },
    {
      name: 'helpfulVotes',
      type: 'array',
      access: {
        // Managed via API endpoints only
        update: nobody,
      },
      admin: {
        position: 'sidebar',
        description: 'Users who voted this review as helpful (managed via API)',
        readOnly: true,
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'votedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'notHelpfulVotes',
      type: 'array',
      access: {
        // Managed via API endpoints only
        update: nobody,
      },
      admin: {
        position: 'sidebar',
        description: 'Users who voted this review as not helpful (managed via API)',
        readOnly: true,
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'votedAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'adminResponse',
      type: 'group',
      access: {
        // Only admins and developers can add/edit admin responses
        update: isAdminField,
      },
      admin: {
        description: 'Official response from store admins',
      },
      hooks: {
        beforeChange: [
          ({ siblingData: _siblingData, value }) => {
            // Auto-set respondedAt when response is added or changed
            if (value?.response && value.response.trim().length > 0) {
              if (!value.respondedAt) {
                return {
                  ...value,
                  respondedAt: new Date().toISOString(),
                }
              }
            }
            return value
          },
        ],
      },
      fields: [
        {
          name: 'response',
          type: 'textarea',
          maxLength: 1000,
        },
        {
          name: 'respondedAt',
          type: 'date',
          access: {
            // Auto-populated timestamp, prevent manual updates
            update: nobody,
          },
          admin: {
            readOnly: true,
            description: 'Auto-populated when response is added',
          },
        },
      ],
    },
  ],
}
