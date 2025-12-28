import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import StorefrontForm from './StorefrontForm'

export default async function StorefrontPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/storefront',
  })
  const payload = await getPayload({ config })

  // Get seller's storefront
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    depth: 2,
    limit: 1,
  })

  const storefront = storefronts.docs[0] || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{storefront ? 'ویرایش فروشگاه' : 'ایجاد فروشگاه'}</h1>
        <p className="text-base-content/60 mt-1">
          {storefront
            ? 'اطلاعات فروشگاه خود را ویرایش کنید'
            : 'اطلاعات فروشگاه خود را وارد کنید تا فروش را آغاز کنید'}
        </p>
      </div>

      <StorefrontForm storefront={storefront} />
    </div>
  )
}
