import React from 'react'
import Image from 'next/image'
import { getMeUser } from '@/utilities/getMeUser'
import AccountSidebar from './AccountSidebar'
import OgFanBadge from './OgFanBadge'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getMeUser({
    nullUserRedirect: '/auth/login?redirect=/account',
  })

  // Get profile picture URL if available (for OAuth users)
  const profilePictureUrl = user.picture || null

  // Get user initials for fallback avatar
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  // Get display name
  const displayName =
    user.firstName || user.lastName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : 'حساب کاربری'

  // Check if user is an OG Fan
  const isOgFan = user.ogfan === true

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div
        className={`relative overflow-hidden ${
          isOgFan
            ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400'
            : 'bg-gradient-to-r from-primary via-primary/95 to-primary/85'
        } text-primary-content`}
      >
        {/* OG Fan sparkle effects */}
        {isOgFan && (
          <>
            {/* Animated sparkles background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 left-[10%] w-2 h-2 bg-white rounded-full animate-pulse opacity-60"></div>
              <div
                className="absolute top-8 left-[25%] w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-40"
                style={{ animationDelay: '0.5s' }}
              ></div>
              <div
                className="absolute top-3 left-[40%] w-1 h-1 bg-white rounded-full animate-pulse opacity-50"
                style={{ animationDelay: '1s' }}
              ></div>
              <div
                className="absolute top-10 left-[55%] w-2 h-2 bg-white rounded-full animate-pulse opacity-70"
                style={{ animationDelay: '0.3s' }}
              ></div>
              <div
                className="absolute top-5 left-[70%] w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-50"
                style={{ animationDelay: '0.8s' }}
              ></div>
              <div
                className="absolute top-12 left-[85%] w-1 h-1 bg-white rounded-full animate-pulse opacity-60"
                style={{ animationDelay: '1.2s' }}
              ></div>
              <div
                className="absolute bottom-8 left-[15%] w-1 h-1 bg-white rounded-full animate-pulse opacity-40"
                style={{ animationDelay: '0.7s' }}
              ></div>
              <div
                className="absolute bottom-4 left-[60%] w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-50"
                style={{ animationDelay: '0.4s' }}
              ></div>
              <div
                className="absolute bottom-10 left-[80%] w-2 h-2 bg-white rounded-full animate-pulse opacity-30"
                style={{ animationDelay: '1.1s' }}
              ></div>
            </div>
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none"></div>
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 relative">
          {/* OG Fan Banner */}
          {isOgFan && (
            <div className="absolute top-0 right-0 md:right-4">
              <OgFanBadge variant="banner" />
            </div>
          )}

          <div className="flex items-center gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative">
              {/* OG Fan golden glow ring */}
              {isOgFan && (
                <div className="absolute -inset-1.5 md:-inset-2 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 rounded-full animate-spin-slow opacity-75 blur-sm"></div>
              )}
              {profilePictureUrl ? (
                <div
                  className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden shadow-lg ${
                    isOgFan
                      ? 'ring-4 ring-yellow-300/80 shadow-yellow-500/50 shadow-xl'
                      : 'ring-4 ring-white/20'
                  }`}
                >
                  <Image
                    src={profilePictureUrl}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full shadow-lg flex items-center justify-center ${
                    isOgFan
                      ? 'bg-gradient-to-br from-amber-100 to-yellow-200 ring-4 ring-yellow-300/80 shadow-yellow-500/50 shadow-xl'
                      : 'bg-primary-content/20 ring-4 ring-white/20'
                  }`}
                >
                  <span
                    className={`text-xl md:text-3xl font-bold ${isOgFan ? 'text-amber-700' : 'text-primary-content'}`}
                  >
                    {initials || '?'}
                  </span>
                </div>
              )}
              {/* Crown for OG fans instead of online indicator */}
              {isOgFan ? (
                <OgFanBadge variant="avatar-crown" />
              ) : (
                <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-success rounded-full border-2 border-primary"></div>
              )}
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className={`text-xl md:text-3xl font-bold pb-1 truncate ${isOgFan ? 'text-amber-900' : ''}`}
                >
                  {displayName}
                </h1>
                {isOgFan && <OgFanBadge variant="vip-tag" />}
              </div>
              <p
                className={`text-sm md:text-base truncate mt-1 ${isOgFan ? 'text-amber-800/80' : 'text-primary-content/80'}`}
              >
                {user.email}
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* OG Fan special badge */}
                {isOgFan && <OgFanBadge variant="badge" />}

                {/* Role badge - only show for non-customer roles */}
                {user.roles &&
                  (() => {
                    // Priority order: developer > superadmin > admin > seller
                    if (user.roles.includes('developer')) {
                      return (
                        <span
                          className={`badge badge-sm ${isOgFan ? 'bg-amber-800/30 border-amber-600/50 text-amber-900' : 'bg-white/20 border-white/30 text-white'}`}
                        >
                          برنامه‌نویس
                        </span>
                      )
                    }
                    if (user.roles.includes('superadmin')) {
                      return (
                        <span
                          className={`badge badge-sm ${isOgFan ? 'bg-amber-800/30 border-amber-600/50 text-amber-900' : 'bg-white/20 border-white/30 text-white'}`}
                        >
                          مدیر ارشد
                        </span>
                      )
                    }
                    if (user.roles.includes('admin')) {
                      return (
                        <span
                          className={`badge badge-sm ${isOgFan ? 'bg-amber-800/30 border-amber-600/50 text-amber-900' : 'bg-white/20 border-white/30 text-white'}`}
                        >
                          مدیر
                        </span>
                      )
                    }
                    if (user.roles.includes('seller')) {
                      return (
                        <span
                          className={`badge badge-sm ${isOgFan ? 'bg-amber-800/30 border-amber-600/50 text-amber-900' : 'bg-white/20 border-white/30 text-white'}`}
                        >
                          فروشنده
                        </span>
                      )
                    }
                    return null
                  })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <AccountSidebar user={user} />

          {/* Page content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
