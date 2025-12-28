import type { Endpoint, PayloadRequest } from 'payload'

interface CategoryUpdate {
  id: string
  displayOrder: number
}

export const reorderCategories: Endpoint = {
  path: '/reorder-categories',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload, user } = req

    // Check authentication
    if (!user) {
      return Response.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 },
      )
    }

    // Check if user has permission to manage categories
    const canManageCategories =
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer') ||
      user.roles?.includes('storefront_owner')

    if (!canManageCategories) {
      return Response.json(
        {
          success: false,
          error: 'You do not have permission to reorder categories',
        },
        { status: 403 },
      )
    }

    try {
      const body = await req.json?.()
      const { categories } = body || {}

      // Validate categories array
      if (!Array.isArray(categories) || categories.length === 0) {
        return Response.json(
          {
            success: false,
            error: 'Categories array is required',
          },
          { status: 400 },
        )
      }

      // Validate each category update
      for (const cat of categories as CategoryUpdate[]) {
        if (!cat.id || typeof cat.id !== 'string') {
          return Response.json(
            {
              success: false,
              error: 'Each category must have a valid id',
            },
            { status: 400 },
          )
        }
        if (typeof cat.displayOrder !== 'number') {
          return Response.json(
            {
              success: false,
              error: 'Each category must have a valid displayOrder',
            },
            { status: 400 },
          )
        }
      }

      // Get user's storefront if they're a storefront owner
      let userStorefrontId: string | null = null
      if (
        user.roles?.includes('storefront_owner') &&
        !user.roles?.includes('admin') &&
        !user.roles?.includes('developer')
      ) {
        const storefront = await payload.find({
          collection: 'storefronts',
          where: {
            seller: {
              equals: user.id,
            },
          },
          limit: 1,
        })
        if (storefront.docs.length > 0) {
          userStorefrontId = storefront.docs[0].id
        }
      }

      // Update each category's displayOrder
      const updatePromises = (categories as CategoryUpdate[]).map(async (cat) => {
        // For storefront owners, verify they own the category
        if (userStorefrontId) {
          const existingCategory = await payload.findByID({
            collection: 'categories',
            id: cat.id,
            depth: 0,
          })

          // Check if category belongs to user's storefront
          const categoryStores = existingCategory.stores || []
          const belongsToUser = categoryStores.some((store: string | { id: string }) => {
            const storeId = typeof store === 'string' ? store : store.id
            return storeId === userStorefrontId
          })

          if (!belongsToUser) {
            throw new Error(`Category ${cat.id} does not belong to your storefront`)
          }
        }

        return payload.update({
          collection: 'categories',
          id: cat.id,
          data: {
            displayOrder: cat.displayOrder,
          },
          // Always override access since we've already verified ownership above
          overrideAccess: true,
        })
      })

      await Promise.all(updatePromises)

      return Response.json(
        {
          success: true,
          message: 'Categories reordered successfully',
        },
        { status: 200 },
      )
    } catch (error: unknown) {
      console.error('Error reordering categories:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder categories'
      return Response.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 },
      )
    }
  },
}
