import type { Access, FieldAccess } from 'payload'

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
