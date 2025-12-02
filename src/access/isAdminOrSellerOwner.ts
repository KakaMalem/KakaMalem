import type { Access } from 'payload'

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

    // Sellers can only access their own resources
    if (user.roles?.includes('seller')) {
      return {
        [ownerField]: {
          equals: user.id,
        },
      }
    }

    return false
  }
}
