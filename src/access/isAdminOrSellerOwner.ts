import type { Access, Where } from 'payload'

/**
 * Factory function for owner-based access control
 * - Admins/Developers: Can access any resource
 * - Sellers: Can only access resources they own (where ownerField equals their ID)
 *
 * @param ownerField - The field name that stores the owner/seller ID (e.g., 'seller', 'uploadedBy')
 * @returns Access control function
 */
export const createIsAdminOrSellerOwner = (ownerField: string): Access => {
  return ({ req: { user } }) => {
    if (!user) return false

    // Technical staff have full access
    if (
      user.roles?.includes('admin') ||
      user.roles?.includes('superadmin') ||
      user.roles?.includes('developer')
    ) {
      return true
    }

    // Sellers and storefront owners can only access their own resources
    if (user.roles?.includes('seller') || user.roles?.includes('storefront_owner')) {
      return {
        [ownerField]: {
          equals: user.id,
        },
      }
    }

    return false
  }
}

/**
 * Product-specific access control that checks both:
 * 1. Direct seller ownership (product.seller === user.id)
 * 2. Storefront ownership (product.stores contains a storefront owned by user)
 *
 * This is needed because products can be linked to storefronts via the `stores` field,
 * and the storefront owner should be able to edit products in their store.
 */
export const isProductOwner: Access = ({ req: { user } }): boolean | Where => {
  if (!user) return false

  // Technical staff have full access
  if (
    user.roles?.includes('admin') ||
    user.roles?.includes('superadmin') ||
    user.roles?.includes('developer')
  ) {
    return true
  }

  // Sellers and storefront owners can access their own products
  if (user.roles?.includes('seller') || user.roles?.includes('storefront_owner')) {
    return {
      or: [
        // Direct seller ownership
        { seller: { equals: user.id } },
        // Storefront ownership - product is in a store owned by this user
        { 'stores.seller': { equals: user.id } },
      ],
    }
  }

  return false
}
