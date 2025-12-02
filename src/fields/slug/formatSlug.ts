import type { CollectionSlug, FieldHook, PayloadRequest } from 'payload'

export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .replace(/\+/g, 'plus') // Convert + to 'plus'
    .replace(/&/g, 'and') // Convert & to 'and'
    .replace(/[^\w\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF-]/g, '') // Keep alphanumeric, Persian/Arabic, spaces, and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens into one
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

export const formatSlugHook =
  (fallback: string, collectionSlug: CollectionSlug = 'products'): FieldHook =>
  async ({ data, operation, value, req, originalDoc }) => {
    if (typeof value === 'string' && value) {
      const formattedSlug = formatSlug(value)

      // Check for uniqueness and append number if needed
      if (operation === 'create' || operation === 'update') {
        return await ensureUniqueSlug(formattedSlug, req, operation, originalDoc, collectionSlug)
      }
      return formattedSlug
    }

    if (operation === 'create' || !data?.slug) {
      const fallbackData = data?.[fallback] || data?.[fallback]

      if (fallbackData && typeof fallbackData === 'string') {
        const formattedSlug = formatSlug(fallbackData)

        // Check for uniqueness and append number if needed
        if (operation === 'create' || operation === 'update') {
          return await ensureUniqueSlug(formattedSlug, req, operation, originalDoc)
        }
        return formattedSlug
      }
    }

    return value
  }

/**
 * Ensure slug is unique by checking the database and appending numbers if needed
 */
async function ensureUniqueSlug(
  baseSlug: string,
  req: PayloadRequest,
  operation: 'create' | 'update',
  originalDoc?: { id?: string | number },
  collectionSlug: CollectionSlug = 'products',
): Promise<string> {
  let slug = baseSlug
  let counter = 1
  let isUnique = false

  while (!isUnique) {
    try {
      const existingDocs = await req.payload.find({
        collection: collectionSlug,
        where: {
          slug: {
            equals: slug,
          },
          ...(operation === 'update' && originalDoc?.id
            ? {
                id: {
                  not_equals: originalDoc.id,
                },
              }
            : {}),
        },
        limit: 1,
      })

      if (existingDocs.docs.length === 0) {
        isUnique = true
      } else {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    } catch (error) {
      req.payload.logger.error(`Error checking slug uniqueness: ${error}`)
      // Fallback: append timestamp
      slug = `${baseSlug}-${Date.now()}`
      isUnique = true
    }
  }

  return slug
}
