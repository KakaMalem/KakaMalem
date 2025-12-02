import type { Access, FieldAccess } from 'payload'

/**
 * Check if user is a superadmin
 */
export const isSuperAdmin: Access = ({ req: { user } }) => {
  return user?.roles?.includes('superadmin') ?? false
}

/**
 * Field-level access: Only superadmins can access
 */
export const isSuperAdminField: FieldAccess = ({ req: { user } }) => {
  return !!user?.roles?.includes('superadmin')
}
