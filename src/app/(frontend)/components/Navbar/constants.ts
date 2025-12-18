import { buildLoginUrl } from '@/utilities/redirect'

export interface MobileMenuItem {
  href: string
  label: string
  isSignIn?: boolean
}

export interface AccountMenuItem {
  href?: string
  label?: string
  isBold?: boolean
  isDivider?: boolean
}

/**
 * Generates account menu items based on auth status
 * @param isLoggedIn - Whether the user is logged in
 * @param userName - Optional user name/email to display
 * @param currentPath - Current path for redirect parameter
 * @param userRoles - Optional array of user roles
 */
export const getAccountMenuItems = (
  isLoggedIn: boolean,
  userName?: string,
  currentPath?: string,
  userRoles?: string[],
): AccountMenuItem[] => {
  if (isLoggedIn) {
    // --- LOGGED IN MENU ---
    // Check if user has admin panel access (same logic as Users collection access.admin)
    const hasAdminAccess = !!(
      userRoles?.includes('superadmin') ||
      userRoles?.includes('admin') ||
      userRoles?.includes('developer') ||
      userRoles?.includes('seller')
    )

    const menuItems: AccountMenuItem[] = [
      {
        href: '/account',
        label: `سلام، ${userName || 'کاربر'}`,
        isBold: true,
      },
      { isDivider: true },
    ]

    // Add admin panel link for users with admin panel access
    if (hasAdminAccess) {
      menuItems.push({ href: '/admin', label: 'پنل مدیریت' })
      menuItems.push({ isDivider: true })
    }

    menuItems.push(
      { href: '/account', label: 'حساب کاربری' },
      { href: '/account/orders', label: 'سفارش‌های من' },
      { href: '/account/wishlist', label: 'علاقه‌مندی‌ها' },
      { isDivider: true },
      { href: '/auth/logout', label: 'خروج' },
    )

    return menuItems
  }

  // --- LOGGED OUT MENU ---
  // Add redirect parameter to login links so users return to current page
  const loginUrl = buildLoginUrl(currentPath)

  return [
    { href: loginUrl, label: 'ورود', isBold: true },
    { href: '/auth/register', label: 'مشتری جدید؟ از اینجا شروع کنید.' },
    { isDivider: true },
    { href: buildLoginUrl('/account/orders'), label: 'سفارش‌های من' },
    { href: buildLoginUrl('/account'), label: 'حساب کاربری' },
    { href: buildLoginUrl('/account/wishlist'), label: 'علاقه‌مندی‌ها' },
  ]
}
