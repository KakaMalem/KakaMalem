import type { Access } from 'payload'

/**
 * Check if user is admin, superadmin, developer, seller, or storefront owner
 */
export const isAdminSellerOrDeveloper: Access = ({ req: { user } }) => {
  return (
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('developer') ||
    user?.roles?.includes('seller') ||
    user?.roles?.includes('storefront_owner') ||
    false
  )
}
