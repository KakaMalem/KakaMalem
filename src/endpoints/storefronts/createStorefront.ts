import type { Endpoint } from 'payload'

/**
 * Create Storefront Endpoint
 *
 * This endpoint allows authenticated users to create a storefront and become a seller.
 * It handles the entire flow:
 * 1. Validates the user is logged in and doesn't already have a storefront
 * 2. Creates the storefront with the user as seller
 * 3. Updates the user's roles to include 'storefront_owner'
 *
 * This is necessary because regular customers don't have access to create storefronts
 * directly through the collection API.
 */
export const createStorefrontEndpoint: Endpoint = {
  path: '/create-storefront',
  method: 'post',
  handler: async (req) => {
    const { payload, user } = req

    // Check if user is authenticated
    if (!user) {
      return Response.json({ error: 'برای ایجاد فروشگاه باید وارد شوید' }, { status: 401 })
    }

    // Parse request body
    let body: {
      name?: string
      slug?: string
      description?: string
      contactPhone?: string
    }

    try {
      body = (await req.json?.()) || {}
    } catch {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, slug, description, contactPhone } = body

    // Validate required fields
    if (!name || !slug) {
      return Response.json({ error: 'نام و آدرس فروشگاه الزامی است' }, { status: 400 })
    }

    // Check if user already has a storefront
    const existingStorefront = await payload.find({
      collection: 'storefronts',
      where: {
        seller: {
          equals: user.id,
        },
      },
      limit: 1,
    })

    if (existingStorefront.docs.length > 0) {
      return Response.json({ error: 'شما قبلاً یک فروشگاه دارید' }, { status: 400 })
    }

    // Check if slug is already taken
    const existingSlug = await payload.find({
      collection: 'storefronts',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
    })

    if (existingSlug.docs.length > 0) {
      return Response.json({ error: 'این آدرس فروشگاه قبلاً استفاده شده است' }, { status: 400 })
    }

    try {
      // Create storefront with overrideAccess
      const storefront = await payload.create({
        collection: 'storefronts',
        data: {
          name,
          slug,
          description: description || '',
          contactPhone: contactPhone || '',
          seller: user.id,
          status: 'active', // Auto-approve for now
        },
        overrideAccess: true, // Bypass access control since we've validated everything
      })

      // Update user roles to include storefront_owner
      type UserRole =
        | 'customer'
        | 'storefront_owner'
        | 'seller'
        | 'admin'
        | 'superadmin'
        | 'developer'
      const currentRoles = (user.roles as UserRole[]) || []
      if (!currentRoles.includes('storefront_owner')) {
        const newRoles: UserRole[] = [...currentRoles, 'storefront_owner']
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            roles: newRoles,
          },
          overrideAccess: true,
        })
      }

      return Response.json({
        success: true,
        storefront,
        message: 'فروشگاه شما با موفقیت ایجاد شد',
      })
    } catch (error) {
      console.error('Error creating storefront:', error)
      return Response.json(
        { error: error instanceof Error ? error.message : 'خطا در ایجاد فروشگاه' },
        { status: 500 },
      )
    }
  },
}
