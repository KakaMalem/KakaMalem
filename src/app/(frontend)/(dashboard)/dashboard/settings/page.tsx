import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { User, Shield, ExternalLink } from 'lucide-react'
import StorefrontForm from '../storefront/StorefrontForm'

export default async function DashboardSettingsPage() {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard/settings',
  })
  const payload = await getPayload({ config })

  // Check if user should see admin panel link (not for storefront_owner only users)
  const showAdminPanel = !!(
    user.roles?.includes('superadmin') ||
    user.roles?.includes('admin') ||
    user.roles?.includes('developer') ||
    user.roles?.includes('seller')
  )

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
        <h1 className="text-2xl font-bold">تنظیمات</h1>
        <p className="text-base-content/60 mt-1">مدیریت تنظیمات فروشگاه و حساب کاربری</p>
      </div>

      {/* Storefront Form */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {storefront ? 'تنظیمات فروشگاه' : 'ایجاد فروشگاه'}
        </h2>
        <StorefrontForm storefront={storefront} />
      </div>

      <div className="divider"></div>

      <div className="grid gap-6">
        {/* Account Settings */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-info/10">
                <User className="w-6 h-6 text-info" />
              </div>
              <div>
                <h2 className="font-bold text-lg">تنظیمات حساب کاربری</h2>
                <p className="text-sm text-base-content/60">
                  اطلاعات شخصی، رمز عبور و تنظیمات امنیتی
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/account/settings" className="btn btn-info btn-sm">
                <User className="w-4 h-4" />
                تنظیمات حساب
              </Link>
            </div>
          </div>
        </div>

        {/* Admin Panel Access - Only show for sellers and admins, not storefront_owner */}
        {showAdminPanel && (
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">پنل مدیریت</h2>
                  <p className="text-sm text-base-content/60">
                    دسترسی به پنل مدیریت برای مدیریت پیشرفته محصولات و سفارشات
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin" className="btn btn-accent btn-sm" target="_blank">
                  <ExternalLink className="w-4 h-4" />
                  ورود به پنل مدیریت
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
