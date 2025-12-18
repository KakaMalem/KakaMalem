import type { Access } from 'payload'

/**
 * Admins, superadmins, and developers can access all users.
 * Other authenticated users can only access their own data.
 */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false

  if (
    user.roles?.includes('admin') ||
    user.roles?.includes('superadmin') ||
    user.roles?.includes('developer')
  ) {
    return true
  }

  return {
    id: {
      equals: user.id,
    },
  }
}
