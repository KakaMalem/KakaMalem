import type { Access } from 'payload'

/**
 * Check if user is admin, superadmin, seller, or storefront owner
 */
export const isAdminOrSeller: Access = ({ req: { user } }) => {
  return (
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('seller') ||
    user?.roles?.includes('storefront_owner') ||
    false
  )
}
