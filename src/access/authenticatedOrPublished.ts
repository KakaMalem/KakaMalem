import type { Access, Where } from 'payload'

/**
 * Published content is available to all, drafts only to admins/sellers/developers
 * Includes legacy fallback for documents without _status field
 */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  // Technical and business staff can see all (including drafts)
  if (
    user?.roles?.includes('admin') ||
    user?.roles?.includes('superadmin') ||
    user?.roles?.includes('developer') ||
    user?.roles?.includes('seller')
  ) {
    return true
  }

  // Public and customers can only see published documents
  return {
    or: [
      {
        _status: {
          equals: 'published',
        },
      },
      {
        _status: {
          exists: false, // Legacy documents without _status
        },
      },
    ],
  } as Where
}
