import type { Access } from 'payload'

/**
 * Check if user is admin, superadmin, or seller
 */
export const isAdminOrSeller: Access = ({ req: { user } }) => {
  return (
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('seller') ||
    false
  )
}
