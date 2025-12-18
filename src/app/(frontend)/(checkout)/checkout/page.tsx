import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import CheckoutClient from './page.client'
import type { SiteSetting } from '@/payload-types'

// Force dynamic rendering since we use authentication (cookies)
export const dynamic = 'force-dynamic'

interface FreeDeliverySettings {
  enabled: boolean
  threshold: number
  badgeText: string
}

interface DeliverySettings {
  shippingCost: number
  freeDelivery: FreeDeliverySettings
}

async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({ slug: 'site-settings' })) as SiteSetting

    return {
      shippingCost: settings.shippingCost ?? 50,
      freeDelivery: {
        enabled: settings.freeDeliveryEnabled ?? true,
        threshold: settings.freeDeliveryThreshold ?? 1000,
        badgeText: settings.freeDeliveryBadgeText ?? 'ارسال رایگان',
      },
    }
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return {
      shippingCost: 50,
      freeDelivery: { enabled: true, threshold: 1000, badgeText: 'ارسال رایگان' },
    }
  }
}

export default async function CheckoutPage() {
  const [{ user }, deliverySettings] = await Promise.all([
    getMeUser({ nullUserRedirect: undefined }),
    getDeliverySettings(),
  ])

  return (
    <CheckoutClient
      user={user || null}
      shippingCost={deliverySettings.shippingCost}
      freeDelivery={deliverySettings.freeDelivery}
    />
  )
}
