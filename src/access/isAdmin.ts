import type { Access, FieldAccess } from 'payload'

/**
 * Check if user is an admin, superadmin, or developer
 * Developers have at minimum admin-level access
 */
export const isAdmin: Access = ({ req: { user } }) => {
  return (
    user?.roles?.includes('admin') ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('developer') ||
    false
  )
}

/**
 * Field-level access: Only admins, superadmins, or developers can access
 */
export const isAdminField: FieldAccess = ({ req: { user } }) => {
  return !!(
    user?.roles?.includes('admin') ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('developer')
  )
}
