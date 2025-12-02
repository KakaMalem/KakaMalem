import type { PayloadRequest, Endpoint } from 'payload'

export const getProduct: Endpoint = {
  path: '/products/:id',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    try {
      const { id } = req.routeParams || {}

      if (!id || typeof id !== 'string') {
        return Response.json(
          {
            success: false,
            error: 'Product ID is required',
          },
          { status: 400 },
        )
      }

      const product = await req.payload.findByID({
        collection: 'products',
        id,
      })

      if (!product) {
        return Response.json(
          {
            success: false,
            error: 'Product not found',
          },
          { status: 404 },
        )
      }

      return Response.json(
        {
          success: true,
          data: product,
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Error fetching product:', error)
      return Response.json(
        {
          success: false,
          error: 'Failed to fetch product',
        },
        { status: 500 },
      )
    }
  },
}
