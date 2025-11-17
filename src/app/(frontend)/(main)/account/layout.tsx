import React from 'react'
import { getMeUser } from '@/utilities/getMeUser'
import AccountSidebar from './AccountSidebar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account',
  })

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-12">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="avatar avatar-placeholder">
              <div className="bg-neutral text-neutral-content w-16 md:w-24 rounded-full flex items-center justify-center">
                <span className="text-xl md:text-3xl leading-none uppercase">
                  {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-3xl font-bold mb-1 truncate">
                {user.firstName || user.lastName
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : 'Account'}
              </h1>
              <p className="opacity-90 text-sm md:text-base truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <AccountSidebar user={user} />

          {/* Page content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
