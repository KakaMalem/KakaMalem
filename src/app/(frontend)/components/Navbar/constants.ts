import { buildLoginUrl } from '@/utilities/redirect'

export interface MobileMenuItem {
  href: string
  label: string
  isSignIn?: boolean
}

export type IconType =
  | 'user'
  | 'orders'
  | 'heart'
  | 'settings'
  | 'logout'
  | 'login'
  | 'register'
  | 'admin'
  | 'dashboard'
  | 'store'
  | 'becomeSeller'

export interface AccountMenuItem {
  href?: string
  label?: string
  isBold?: boolean
  isDivider?: boolean
  icon?: IconType
  isHeader?: boolean
  subtitle?: string
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
  userEmail?: string,
): AccountMenuItem[] => {
  if (isLoggedIn) {
    // --- LOGGED IN MENU ---
    const isSeller = userRoles?.includes('seller')
    const isStorefrontOwner = userRoles?.includes('storefront_owner')

    // Check if user has admin panel access
    // Note: storefront_owner has technical access to admin panel but we don't show the link in navbar
    // They should use the dashboard instead. The admin panel link is only shown for sellers and admins.
    const showAdminPanelLink = !!(
      userRoles?.includes('superadmin') ||
      userRoles?.includes('admin') ||
      userRoles?.includes('developer') ||
      userRoles?.includes('seller')
    )

    const menuItems: AccountMenuItem[] = [
      {
        label: userName || 'کاربر',
        subtitle: userEmail,
        isHeader: true,
        isBold: true,
      },
      { isDivider: true },
    ]

    // Add seller dashboard for sellers and storefront owners
    if (isSeller || isStorefrontOwner) {
      menuItems.push({ href: '/dashboard', label: 'داشبورد فروشنده', icon: 'dashboard' })
    }

    // Add admin panel link - NOT shown for storefront_owner (they use dashboard instead)
    if (showAdminPanelLink) {
      menuItems.push({ href: '/admin', label: 'پنل مدیریت', icon: 'admin' })
    }

    // Add "Become a Seller" for users who are not sellers or storefront owners
    if (!isSeller && !isStorefrontOwner) {
      menuItems.push({ href: '/become-a-seller', label: 'فروشنده شوید', icon: 'becomeSeller' })
    }

    // Always add divider after role-specific items (seller dashboard, admin panel, become seller)
    menuItems.push({ isDivider: true })

    menuItems.push(
      { href: '/account', label: 'حساب کاربری', icon: 'user' },
      { href: '/account/orders', label: 'سفارش‌های من', icon: 'orders' },
      { href: '/account/wishlist', label: 'علاقه‌مندی‌ها', icon: 'heart' },
      { href: '/account/settings', label: 'تنظیمات', icon: 'settings' },
      { isDivider: true },
      { href: '/auth/logout', label: 'خروج از حساب', icon: 'logout' },
    )

    return menuItems
  }

  // --- LOGGED OUT MENU ---
  // Add redirect parameter to login links so users return to current page
  const loginUrl = buildLoginUrl(currentPath)

  return [
    { href: loginUrl, label: 'ورود به حساب', icon: 'login', isBold: true },
    { href: '/auth/register', label: 'ایجاد حساب جدید', icon: 'register' },
    { isDivider: true },
    { href: buildLoginUrl('/account/orders'), label: 'سفارش‌های من', icon: 'orders' },
    { href: buildLoginUrl('/account/wishlist'), label: 'علاقه‌مندی‌ها', icon: 'heart' },
  ]
}
