import React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import DashboardSidebar from './DashboardSidebar'
import { ExternalLink, Store } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/dashboard',
  })

  // Check if user is a seller or storefront owner
  const isSeller = user.roles?.includes('seller')
  const isStorefrontOwner = user.roles?.includes('storefront_owner')
  const isAdmin =
    user.roles?.includes('admin') ||
    user.roles?.includes('superadmin') ||
    user.roles?.includes('developer')

  if (!isSeller && !isStorefrontOwner && !isAdmin) {
    redirect('/account')
  }

  // Get user's storefront
  const payload = await getPayload({ config })
  const storefronts = await payload.find({
    collection: 'storefronts',
    where: {
      seller: { equals: user.id },
    },
    limit: 1,
  })

  const storefront = storefronts.docs[0]
  const storefrontUrl = storefront?.slug ? `/store/${storefront.slug}` : null

  return (
    <div className="min-h-screen bg-base-100">
      {/* Professional Header */}
      <header className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 text-primary-content sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 group" title="صفحه اصلی">
                <span className="font-bold text-lg hidden sm:block">کاکا معلم</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-primary-content/30"></div>
              <div className="hidden sm:block">
                <h1 className="font-semibold text-sm">داشبورد فروشنده</h1>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {storefrontUrl ? (
                <Link
                  href={storefrontUrl}
                  className="btn btn-ghost btn-sm gap-2 text-primary-content hover:bg-primary-content/20"
                  title="مشاهده فروشگاه"
                  target="_blank"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">مشاهده فروشگاه</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  target="_blank"
                  className="btn btn-ghost btn-sm gap-2 text-primary-content hover:bg-primary-content/20"
                  title="مشاهده سایت"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">مشاهده سایت</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <DashboardSidebar user={user} />

          {/* Page content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
