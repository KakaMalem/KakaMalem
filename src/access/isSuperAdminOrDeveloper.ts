import type { User } from '@/payload-types'
import type { ClientUser, FieldAccess } from 'payload'

/**
 * Check if user is superadmin or developer (for seeing hidden fields)
 * Note: This is a helper function, not a Payload Access function
 * Accepts both User (from payload-types) and ClientUser (from Payload admin UI)
 */
export const isSuperAdminOrDeveloper = (user: User | ClientUser | null | undefined) => {
  return !!(user?.roles?.includes('superadmin') || user?.roles?.includes('developer'))
}

/**
 * Field-level access control for superadmins and developers only
 */
export const isSuperAdminOrDeveloperField: FieldAccess = ({ req: { user } }) => {
  return isSuperAdminOrDeveloper(user)
}
