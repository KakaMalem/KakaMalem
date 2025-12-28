import type { Endpoint } from 'payload'

/**
 * Get storefront by slug
 * GET /api/get-storefront
 *
 * Query params:
 * - slug: string (required) - storefront slug
 */
export const getStorefront: Endpoint = {
  path: '/get-storefront',
  method: 'get',
  handler: async (req) => {
    try {
      const { payload } = req

      const url = new URL(req.url || '', 'http://localhost')
      const slug = url.searchParams.get('slug')

      if (!slug) {
        return Response.json({ error: 'Storefront slug is required' }, { status: 400 })
      }

      // Find storefront
      const storefronts = await payload.find({
        collection: 'storefronts',
        where: {
          and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }],
        },
        depth: 2,
        limit: 1,
      })

      if (storefronts.docs.length === 0) {
        return Response.json({ error: 'Storefront not found' }, { status: 404 })
      }

      const storefront = storefronts.docs[0]

      // Get seller's products
      const sellerId =
        typeof storefront.seller === 'object' && storefront.seller
          ? storefront.seller.id
          : storefront.seller

      const products = await payload.find({
        collection: 'products',
        where: {
          and: [{ seller: { equals: sellerId } }, { _status: { equals: 'published' } }],
        },
        limit: 12,
        sort: '-createdAt',
        depth: 1,
      })

      // Get storefront categories
      const categories = await payload.find({
        collection: 'categories',
        where: {
          stores: { contains: storefront.id },
        },
        sort: 'displayOrder',
        limit: 50,
      })

      // Update view count
      await payload.update({
        collection: 'storefronts',
        id: storefront.id,
        data: {
          analytics: {
            ...(storefront.analytics || {}),
            totalViews: (storefront.analytics?.totalViews || 0) + 1,
            lastVisited: new Date().toISOString(),
          },
        },
        overrideAccess: true,
      })

      // Format response
      return Response.json({
        storefront: {
          id: storefront.id,
          name: storefront.name,
          slug: storefront.slug,
          tagline: storefront.tagline,
          description: storefront.description,
          logo: storefront.logo,
          favicon: storefront.favicon,
          headerDisplay: storefront.headerDisplay,
          contactEmail: storefront.contactEmail,
          contactPhone: storefront.contactPhone,
          socialLinks: storefront.socialLinks,
          seo: storefront.seo,
        },
        categories: categories.docs.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.smallCategoryImage,
        })),
        products: products.docs.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          salePrice: product.salePrice,
          images: product.images,
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
          stockStatus: product.stockStatus,
        })),
        totalProducts: products.totalDocs,
      })
    } catch (error) {
      console.error('Get storefront error:', error)
      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to get storefront',
        },
        { status: 500 },
      )
    }
  },
}
