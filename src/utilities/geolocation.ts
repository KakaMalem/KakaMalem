/**
 * Geolocation Service
 *
 * Production-grade IP geolocation with multiple provider fallbacks.
 * Used to automatically capture user location on login/registration.
 * Supports both IP-based and browser GPS geolocation.
 *
 * Providers (in order of priority):
 * 1. ip-api.com - Free tier (45 requests/minute), no API key required
 * 2. ipapi.co - Free tier (30,000 requests/month), no API key required
 *
 * For production with high traffic, consider:
 * - MaxMind GeoIP2 (local database, fastest)
 * - IPinfo.io (100k free/month with API key)
 */

export type LocationSource = 'browser' | 'ip' | 'manual'
export type LocationEvent =
  | 'login'
  | 'register'
  | 'order'
  | 'browser_permission'
  | 'verify_email'
  | 'oauth'

export interface GeoLocation {
  country: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  timezone: string | null
  coordinates: {
    latitude: number | null
    longitude: number | null
  }
  accuracy?: number | null // GPS accuracy in meters (browser only)
  source: LocationSource
  event: LocationEvent
  ip: string
  permissionGranted?: boolean
  lastUpdated: string
}

/**
 * Location data stored in database
 * Uses Payload's point type format: [longitude, latitude]
 */
export interface StoredLocation {
  coordinates?: [number, number] | null // [longitude, latitude] - Payload point format
  accuracy?: number | null
  country?: string | null
  countryCode?: string | null
  region?: string | null
  city?: string | null
  timezone?: string | null
  source?: LocationSource
  event?: LocationEvent
  ip?: string | null
  permissionGranted?: boolean
  lastUpdated?: string
}

export interface LocationHistoryEntry {
  coordinates?: [number, number] | null
  city?: string | null
  country?: string | null
  source?: LocationSource | null
  event?: LocationEvent | null
  timestamp?: string | null
  id?: string | null
}

interface IpApiResponse {
  status: 'success' | 'fail'
  country?: string
  countryCode?: string
  regionName?: string
  city?: string
  timezone?: string
  lat?: number
  lon?: number
  query?: string
  message?: string
}

interface IpApiCoResponse {
  country_name?: string
  country_code?: string
  region?: string
  city?: string
  timezone?: string
  latitude?: number
  longitude?: number
  ip?: string
  error?: boolean
  reason?: string
}

/**
 * Request-like object that has headers
 * Compatible with both standard Request and Payload's PayloadRequest
 */
interface RequestWithHeaders {
  headers: {
    get: (name: string) => string | null
  }
}

/**
 * Extract client IP from request headers
 * Handles various proxy/CDN configurations
 */
export function getClientIp(req: RequestWithHeaders): string {
  // Check standard forwarding headers (in order of preference)
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs; first one is the client
    const ips = forwardedFor.split(',').map((ip) => ip.trim())
    // Filter out private/internal IPs
    const publicIp = ips.find((ip) => !isPrivateIp(ip))
    if (publicIp) return publicIp
    return ips[0] // Fallback to first IP if all are private
  }

  // Cloudflare
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Vercel
  const xRealIp = req.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // AWS ALB / ELB
  const xClientIp = req.headers.get('x-client-ip')
  if (xClientIp) return xClientIp

  // True-Client-IP (Akamai, Cloudflare Enterprise)
  const trueClientIp = req.headers.get('true-client-ip')
  if (trueClientIp) return trueClientIp

  // Fastly
  const fastlyClientIp = req.headers.get('fastly-client-ip')
  if (fastlyClientIp) return fastlyClientIp

  // Default fallback
  return '127.0.0.1'
}

/**
 * Check if IP is private/internal
 * Handles both IPv4 and IPv6 addresses, including IPv4-mapped IPv6 addresses
 */
function isPrivateIp(ip: string): boolean {
  // Extract IPv4 from IPv4-mapped IPv6 address (e.g., ::ffff:10.14.210.20 -> 10.14.210.20)
  let normalizedIp = ip
  const ipv4MappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (ipv4MappedMatch) {
    normalizedIp = ipv4MappedMatch[1]
  }

  // IPv4 private ranges
  const privateRanges = [
    /^127\./, // Loopback
    /^10\./, // Class A private
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // Class B private
    /^192\.168\./, // Class C private
    /^169\.254\./, // Link-local
    /^0\./, // "This" network
    /^::1$/, // IPv6 loopback
    /^::ffff:127\./, // IPv4-mapped loopback
    /^::ffff:10\./, // IPv4-mapped Class A private
    /^::ffff:172\.(1[6-9]|2[0-9]|3[01])\./, // IPv4-mapped Class B private
    /^::ffff:192\.168\./, // IPv4-mapped Class C private
    /^::ffff:169\.254\./, // IPv4-mapped link-local
    /^fe80:/i, // IPv6 link-local
    /^fc00:/i, // IPv6 unique local
    /^fd00:/i, // IPv6 unique local
  ]

  return privateRanges.some((regex) => regex.test(ip) || regex.test(normalizedIp))
}

/**
 * Get geolocation from ip-api.com
 * Free tier: 45 requests per minute
 */
async function getLocationFromIpApi(ip: string, event: LocationEvent): Promise<GeoLocation | null> {
  try {
    // Skip for private IPs (local development)
    if (isPrivateIp(ip)) {
      return createEmptyLocation(ip, event)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,timezone,lat,lon,query`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`ip-api.com responded with ${response.status}`)
    }

    const data: IpApiResponse = await response.json()

    if (data.status === 'fail') {
      throw new Error(data.message || 'ip-api.com lookup failed')
    }

    return {
      country: data.country || null,
      countryCode: data.countryCode || null,
      region: data.regionName || null,
      city: data.city || null,
      timezone: data.timezone || null,
      coordinates: {
        latitude: data.lat ?? null,
        longitude: data.lon ?? null,
      },
      accuracy: null,
      source: 'ip',
      event,
      ip: data.query || ip,
      permissionGranted: false,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('ip-api.com lookup failed:', error)
    return null
  }
}

/**
 * Get geolocation from ipapi.co
 * Free tier: 30,000 requests per month
 */
async function getLocationFromIpApiCo(
  ip: string,
  event: LocationEvent,
): Promise<GeoLocation | null> {
  try {
    // Skip for private IPs (local development)
    if (isPrivateIp(ip)) {
      return createEmptyLocation(ip, event)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'KakaMalem/1.0', // Required by ipapi.co
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`ipapi.co responded with ${response.status}`)
    }

    const data: IpApiCoResponse = await response.json()

    if (data.error) {
      throw new Error(data.reason || 'ipapi.co lookup failed')
    }

    return {
      country: data.country_name || null,
      countryCode: data.country_code || null,
      region: data.region || null,
      city: data.city || null,
      timezone: data.timezone || null,
      coordinates: {
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      accuracy: null,
      source: 'ip',
      event,
      ip: data.ip || ip,
      permissionGranted: false,
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('ipapi.co lookup failed:', error)
    return null
  }
}

/**
 * Create empty location object for private IPs
 */
function createEmptyLocation(ip: string, event: LocationEvent): GeoLocation {
  return {
    country: null,
    countryCode: null,
    region: null,
    city: null,
    timezone: null,
    coordinates: {
      latitude: null,
      longitude: null,
    },
    accuracy: null,
    source: 'ip',
    event,
    ip,
    permissionGranted: false,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Main geolocation function with fallback providers
 * Returns location data or empty object on failure
 */
export async function getGeoLocation(ip: string, event: LocationEvent): Promise<GeoLocation> {
  // For private IPs (local development), return empty location
  if (isPrivateIp(ip)) {
    console.log('Geolocation: Skipping lookup for private IP:', ip)
    return createEmptyLocation(ip, event)
  }

  // Try primary provider (ip-api.com)
  let location = await getLocationFromIpApi(ip, event)

  // Fallback to secondary provider (ipapi.co)
  if (!location) {
    console.log('Geolocation: Falling back to ipapi.co for IP:', ip)
    location = await getLocationFromIpApiCo(ip, event)
  }

  // Return empty location if all providers fail
  if (!location) {
    console.warn('Geolocation: All providers failed for IP:', ip)
    return createEmptyLocation(ip, event)
  }

  return location
}

/**
 * Get geolocation from request object
 * Convenience wrapper that extracts IP and looks up location
 */
export async function getGeoLocationFromRequest(
  req: RequestWithHeaders,
  event: LocationEvent,
): Promise<GeoLocation> {
  const ip = getClientIp(req)
  return getGeoLocation(ip, event)
}

/**
 * Convert GeoLocation to Payload's stored format
 * Handles the conversion from {latitude, longitude} to [longitude, latitude] point format
 * IMPORTANT: When coordinates are null, we omit the field entirely to avoid MongoDB 2dsphere index errors
 */
function toStoredLocation(location: GeoLocation): StoredLocation {
  const { latitude, longitude } = location.coordinates
  const hasValidCoordinates = longitude !== null && latitude !== null

  const stored: StoredLocation = {
    accuracy: location.accuracy,
    country: location.country,
    countryCode: location.countryCode,
    region: location.region,
    city: location.city,
    timezone: location.timezone,
    source: location.source,
    event: location.event,
    ip: location.ip,
    permissionGranted: location.permissionGranted,
    lastUpdated: location.lastUpdated,
  }

  // Only include coordinates if they're valid - MongoDB 2dsphere index rejects null
  if (hasValidCoordinates) {
    stored.coordinates = [longitude, latitude]
  }

  return stored
}

/**
 * Create a location history entry from current location
 * IMPORTANT: When coordinates are null, we omit the field entirely to avoid MongoDB 2dsphere index errors
 */
function toHistoryEntry(location: GeoLocation): LocationHistoryEntry {
  const { latitude, longitude } = location.coordinates
  const hasValidCoordinates = longitude !== null && latitude !== null

  const entry: LocationHistoryEntry = {
    city: location.city,
    country: location.country,
    source: location.source,
    event: location.event,
    timestamp: location.lastUpdated,
  }

  // Only include coordinates if they're valid - MongoDB 2dsphere index rejects null
  if (hasValidCoordinates) {
    entry.coordinates = [longitude, latitude]
  }

  return entry
}

/**
 * Payload instance type for location updates
 */
interface PayloadInstance {
  update: (args: {
    collection: 'users'
    id: string
    data: Record<string, unknown>
    overrideAccess?: boolean
  }) => Promise<unknown>
  findByID: (args: {
    collection: 'users'
    id: string
    overrideAccess?: boolean
  }) => Promise<{ locationHistory?: LocationHistoryEntry[] | null }>
}

/**
 * Update user location in database with history tracking
 * Called after successful login/registration
 */
export async function updateUserLocation(
  payload: PayloadInstance,
  userId: string,
  location: GeoLocation,
): Promise<void> {
  try {
    // Get current user to access location history
    let currentHistory: LocationHistoryEntry[] = []
    try {
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        overrideAccess: true,
      })
      currentHistory = user.locationHistory || []
    } catch {
      // User might not exist yet or other error - continue with empty history
    }

    // Add current location to history (keep last 10)
    const newHistoryEntry = toHistoryEntry(location)
    const updatedHistory = [newHistoryEntry, ...currentHistory].slice(0, 10)

    // Convert to stored format
    const storedLocation = toStoredLocation(location)

    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        location: storedLocation,
        locationHistory: updatedHistory,
      },
      overrideAccess: true, // Bypass access control since this is a system operation
    })

    console.log(`Updated location for user ${userId}:`, {
      country: location.country,
      city: location.city,
      source: location.source,
    })
  } catch (error) {
    // Log but don't fail - location is non-critical
    console.error('Failed to update user location:', error)
  }
}

/**
 * Update user location from browser geolocation
 * Called when user grants location permission on frontend
 */
export async function updateUserLocationFromBrowser(
  payload: PayloadInstance,
  userId: string,
  browserData: {
    latitude: number
    longitude: number
    accuracy?: number
  },
  ip: string,
  event: LocationEvent = 'browser_permission',
): Promise<void> {
  const location: GeoLocation = {
    country: null, // Browser doesn't provide this
    countryCode: null,
    region: null,
    city: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    coordinates: {
      latitude: browserData.latitude,
      longitude: browserData.longitude,
    },
    accuracy: browserData.accuracy ?? null,
    source: 'browser',
    event,
    ip,
    permissionGranted: true,
    lastUpdated: new Date().toISOString(),
  }

  await updateUserLocation(payload, userId, location)
}
