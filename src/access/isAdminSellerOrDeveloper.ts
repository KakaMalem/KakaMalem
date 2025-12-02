import type { Access } from 'payload'

/**
 * Check if user is admin, superadmin, developer, or seller
 */
export const isAdminSellerOrDeveloper: Access = ({ req: { user } }) => {
  return (
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('developer') ||
    user?.roles?.includes('seller') ||
    false
  )
}
