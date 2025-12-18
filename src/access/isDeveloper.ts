import type { User } from '@/payload-types'
import type { Access, ClientUser, FieldAccess } from 'payload'

/**
 * Check if user is a developer (for seeing analytics fields)
 * Helper function that can be used in admin conditions
 * Accepts both User (from payload-types) and ClientUser (from Payload admin UI)
 */
export const isDeveloperOnly = (user: User | ClientUser | null | undefined) => {
  return !!user?.roles?.includes('developer')
}

/**
 * Check if user is a developer (can see all hidden fields)
 */
export const isDeveloper: Access = ({ req: { user } }) => {
  return user?.roles?.includes('developer') ?? false
}

/**
 * Field-level access: Only developers can access
 */
export const isDeveloperField: FieldAccess = ({ req: { user } }) => {
  return !!user?.roles?.includes('developer')
}
