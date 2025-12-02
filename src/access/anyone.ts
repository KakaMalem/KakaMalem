import type { Access } from 'payload'

/**
 * Allow all (public access)
 */
export const anyone: Access = () => true
