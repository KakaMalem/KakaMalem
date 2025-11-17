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
 */
export const getAccountMenuItems = (
  isLoggedIn: boolean,
  userName?: string,
  currentPath?: string,
): AccountMenuItem[] => {
  if (isLoggedIn) {
    // --- LOGGED IN MENU ---
    return [
      {
        href: '/account',
        label: `Hello, ${userName || 'User'}`,
        isBold: true,
      },
      { isDivider: true },
      { href: '/account', label: 'Your Account' },
      { href: '/account/orders', label: 'Your Orders' },
      { href: '/account/wishlist', label: 'Your Wishlists' },
      { isDivider: true },
      { href: '/auth/logout', label: 'Sign out' },
    ]
  }

  // --- LOGGED OUT MENU ---
  // Add redirect parameter to login links so users return to current page
  const loginUrl = buildLoginUrl(currentPath)

  return [
    { href: loginUrl, label: 'Sign in', isBold: true },
    { href: '/auth/register', label: 'New customer? Start here.' },
    { isDivider: true },
    { href: buildLoginUrl('/account/orders'), label: 'Your Orders' },
    { href: buildLoginUrl('/account'), label: 'Your Account' },
    { href: buildLoginUrl('/account/wishlist'), label: 'Your Wishlists' },
  ]
}
