/**
 * Get redirect URL from query params
 */
export function getRedirectUrl(searchParams: URLSearchParams | string): string | null {
  const params = typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams
  return params.get('redirect')
}

/**
 * Build login URL with redirect parameter
 */
export function buildLoginUrl(redirectTo?: string): string {
  const baseUrl = '/auth/login'
  if (!redirectTo) return baseUrl
  return `${baseUrl}?redirect=${encodeURIComponent(redirectTo)}`
}

/**
 * Build URL with redirect parameter
 */
export function buildUrlWithRedirect(url: string, redirectTo?: string): string {
  if (!redirectTo) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}redirect=${encodeURIComponent(redirectTo)}`
}

/**
 * Safely redirect to URL or fallback
 */
export function safeRedirect(url: string | null, fallback: string = '/'): string {
  if (!url) return fallback

  // Only allow relative URLs for security
  if (url.startsWith('/')) {
    return url
  }

  // If it's an absolute URL, return fallback
  return fallback
}
