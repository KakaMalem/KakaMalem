import type { Endpoint, PayloadRequest } from 'payload'

interface ProductUpdate {
  id: string
  displayOrder: number
}

export const reorderProducts: Endpoint = {
  path: '/reorder-products',
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

    // Check if user has permission to manage products
    const canManageProducts =
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer') ||
      user.roles?.includes('seller') ||
      user.roles?.includes('storefront_owner')

    if (!canManageProducts) {
      return Response.json(
        {
          success: false,
          error: 'You do not have permission to reorder products',
        },
        { status: 403 },
      )
    }

    try {
      const body = await req.json?.()
      const { products } = body || {}

      // Validate products array
      if (!Array.isArray(products) || products.length === 0) {
        return Response.json(
          {
            success: false,
            error: 'Products array is required',
          },
          { status: 400 },
        )
      }

      // Validate each product update
      for (const prod of products as ProductUpdate[]) {
        if (!prod.id || typeof prod.id !== 'string') {
          return Response.json(
            {
              success: false,
              error: 'Each product must have a valid id',
            },
            { status: 400 },
          )
        }
        if (typeof prod.displayOrder !== 'number') {
          return Response.json(
            {
              success: false,
              error: 'Each product must have a valid displayOrder',
            },
            { status: 400 },
          )
        }
      }

      // Get user's storefront if they're a seller/storefront owner
      let userStorefrontId: string | null = null
      if (
        (user.roles?.includes('seller') || user.roles?.includes('storefront_owner')) &&
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

      // Update each product's displayOrder
      const updatePromises = (products as ProductUpdate[]).map(async (prod) => {
        // For sellers, verify they own the product
        if (userStorefrontId) {
          const existingProduct = await payload.findByID({
            collection: 'products',
            id: prod.id,
            depth: 0,
          })

          // Check if product belongs to user's storefront or user is the seller
          const productStores = existingProduct.stores || []
          const belongsToStorefront = productStores.some((store: string | { id: string }) => {
            const storeId = typeof store === 'string' ? store : store.id
            return storeId === userStorefrontId
          })

          const sellerId =
            typeof existingProduct.seller === 'object'
              ? existingProduct.seller?.id
              : existingProduct.seller

          const isOwner = sellerId === user.id || belongsToStorefront

          if (!isOwner) {
            throw new Error(`Product ${prod.id} does not belong to you`)
          }
        }

        return payload.update({
          collection: 'products',
          id: prod.id,
          data: {
            displayOrder: prod.displayOrder,
          },
          // Always override access since we've already verified ownership above
          overrideAccess: true,
        })
      })

      await Promise.all(updatePromises)

      return Response.json(
        {
          success: true,
          message: 'Products reordered successfully',
        },
        { status: 200 },
      )
    } catch (error: unknown) {
      console.error('Error reordering products:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder products'
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
