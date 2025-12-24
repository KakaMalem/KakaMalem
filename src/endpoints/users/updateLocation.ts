import type { Endpoint } from 'payload'
import {
  getClientIp,
  type GeoLocation,
  updateUserLocation,
  getGeoLocation,
} from '@/utilities/geolocation'

interface UpdateLocationRequest {
  latitude: number
  longitude: number
  accuracy?: number
}

/**
 * Update user location from browser geolocation
 * Called when user grants location permission on frontend
 *
 * POST /api/update-location
 */
export const updateLocationEndpoint: Endpoint = {
  path: '/update-location',
  method: 'post',
  handler: async (req) => {
    const { payload, user } = req

    // Must be authenticated
    if (!user) {
      return Response.json({ error: 'احراز هویت الزامی است' }, { status: 401 })
    }

    // Parse request body
    let body: UpdateLocationRequest
    try {
      body = (await req.json?.()) || req.body
    } catch {
      return Response.json({ error: 'فرمت درخواست نامعتبر است' }, { status: 400 })
    }

    const { latitude, longitude, accuracy } = body

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return Response.json({ error: 'مختصات نامعتبر است' }, { status: 400 })
    }

    if (latitude < -90 || latitude > 90) {
      return Response.json({ error: 'عرض جغرافیایی نامعتبر است' }, { status: 400 })
    }

    if (longitude < -180 || longitude > 180) {
      return Response.json({ error: 'طول جغرافیایی نامعتبر است' }, { status: 400 })
    }

    try {
      const ip = getClientIp(req)

      // First, try to get city/country info from IP to enrich browser location
      const ipLocation = await getGeoLocation(ip, 'browser_permission')

      // Create a combined location with browser coordinates + IP-based city/country
      const location: GeoLocation = {
        country: ipLocation.country,
        countryCode: ipLocation.countryCode,
        region: ipLocation.region,
        city: ipLocation.city,
        timezone: ipLocation.timezone,
        coordinates: {
          latitude,
          longitude,
        },
        accuracy: accuracy ?? null,
        source: 'browser',
        event: 'browser_permission',
        ip,
        permissionGranted: true,
        lastUpdated: new Date().toISOString(),
      }

      // Update user location with the combined data
      await updateUserLocation(payload, user.id, location)

      return Response.json(
        {
          success: true,
          message: 'موقعیت با موفقیت بروزرسانی شد',
          location: {
            city: location.city,
            country: location.country,
            source: location.source,
          },
        },
        { status: 200 },
      )
    } catch (error) {
      console.error('Failed to update location:', error)
      return Response.json({ error: 'خطا در بروزرسانی موقعیت' }, { status: 500 })
    }
  },
}
