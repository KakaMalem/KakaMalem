import type { Access } from 'payload'

/**
 * Admins can access all, authenticated users can access their own
 */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false

  if (user.roles?.includes('admin') || user.roles?.includes('superadmin')) {
    return true
  }

  return {
    id: {
      equals: user.id,
    },
  }
}
