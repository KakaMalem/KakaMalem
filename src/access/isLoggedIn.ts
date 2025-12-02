import type { Access } from 'payload'

/**
 * Check if user is logged in
 */
export const isLoggedIn: Access = ({ req: { user } }) => {
  return !!user
}
