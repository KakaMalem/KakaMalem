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
 */
export const getAccountMenuItems = (isLoggedIn: boolean, userName?: string): AccountMenuItem[] => {
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
  return [
    { href: '/auth/login', label: 'Sign in', isBold: true },
    { href: '/auth/register', label: 'New customer? Start here.' },
    { isDivider: true },
    { href: '/auth/login', label: 'Your Orders' },
    { href: '/auth/login', label: 'Your Account' },
    { href: '/auth/login', label: 'Your Wishlists' },
  ]
}
