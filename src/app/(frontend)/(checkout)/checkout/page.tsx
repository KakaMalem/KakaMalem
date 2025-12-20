import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import CheckoutClient from './page.client'
import type { SiteSetting } from '@/payload-types'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

type ShippingMode = 'always_free' | 'free_above_threshold' | 'always_charged'

interface ShippingSettings {
  mode: ShippingMode
  cost: number
  freeThreshold: number
}

async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({ slug: 'site-settings' })) as SiteSetting

    return {
      mode: (settings.shippingMode as ShippingMode) ?? 'free_above_threshold',
      cost: settings.shippingCost ?? 50,
      freeThreshold: settings.freeDeliveryThreshold ?? 1000,
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return {
      mode: 'free_above_threshold',
      cost: 50,
      freeThreshold: 1000,
    }
  }
}

export default async function CheckoutPage() {
  const [{ user }, shipping] = await Promise.all([
    getMeUser({ nullUserRedirect: undefined }),
    getShippingSettings(),
  ])

  return <CheckoutClient user={user || null} shipping={shipping} />
}
