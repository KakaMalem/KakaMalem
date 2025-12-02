import type { Access, FieldAccess } from 'payload'

/**
 * Check if user is an admin or superadmin
 */
export const isAdmin: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin') || user?.roles?.includes('superadmin') || false
}

/**
 * Field-level access: Only admins can access
 */
export const isAdminField: FieldAccess = ({ req: { user } }) => {
  return !!(user?.roles?.includes('admin') || user?.roles?.includes('superadmin'))
}
