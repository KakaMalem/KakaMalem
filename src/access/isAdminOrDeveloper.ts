import type { Access, FieldAccess } from 'payload'

/**
 * Check if user is admin, superadmin, or developer (technical staff with full access)
 */
export const isAdminOrDeveloper: Access = ({ req: { user } }) => {
  return (
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('developer') ||
    false
  )
}

/**
 * Field-level access: Only admins and developers can access
 */
export const isAdminOrDeveloperField: FieldAccess = ({ req: { user } }) => {
  return !!(
    user?.roles?.includes('admin') ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('developer')
  )
}
