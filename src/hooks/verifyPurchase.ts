import type { FieldHook, Payload } from 'payload'

/**
 * Checks if a user has purchased a specific product
 * Used for verified purchase badges on reviews
 *
 * @param payload - Payload instance
 * @param userId - User ID to check
 * @param productId - Product ID to verify purchase for
 * @returns Promise<boolean> - true if user has purchased the product
 */
export async function checkVerifiedPurchase(
  payload: Payload,
  userId: string,
  productId: string,
): Promise<boolean> {
  if (!userId || !productId) {
    return false
  }

  try {
    // Check if user has purchased this product
    const orders = await payload.find({
      collection: 'orders',
      where: {
        and: [
          {
            customer: {
              equals: userId,
            },
          },
          {
            'items.product': {
              equals: productId,
            },
          },
          {
            status: {
              in: ['processing', 'shipped', 'delivered'],
            },
          },
        ],
      },
      limit: 1,
    })

    return orders.docs.length > 0
  } catch (error) {
    console.error('Error checking verified purchase:', error)
    return false
  }
}

/**
 * Field hook for auto-verifying purchases on review creation
 * Automatically checks if the user has purchased the product
 */
export const verifyPurchaseHook: FieldHook = async ({ req, value, siblingData }) => {
  // If value is already set to true, keep it
  if (value === true) {
    return value
  }

  const userId = siblingData.user || req.user?.id
  const productId = siblingData.product

  if (!userId || !productId) {
    return false
  }

  return await checkVerifiedPurchase(req.payload, userId, productId)
}
