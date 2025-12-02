import type { FieldAccess } from 'payload'

/**
 * Deny all access (system-managed fields only)
 * Use this for fields that should never be manually updated
 */
export const nobody: FieldAccess = () => false
