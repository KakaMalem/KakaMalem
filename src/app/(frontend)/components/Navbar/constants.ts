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

export const MOBILE_MENU_ITEMS: MobileMenuItem[] = [
  { href: '/auth/login', label: 'Sign in', isSignIn: true },
  { href: '/', label: 'Home' },
  { href: '/deals', label: "Today's Deals" },
  { href: '/orders', label: 'Your Orders' },
  { href: '/account', label: 'Your Account' },
  { href: '/lists', label: 'Your Lists' },
  { href: '/customer-service', label: 'Customer Service' },
]

export const ACCOUNT_MENU_ITEMS: AccountMenuItem[] = [
  { href: '/auth/login', label: 'Sign in', isBold: true },
  { href: '/auth/register', label: 'New customer? Start here.' },
  { isDivider: true },
  { href: '/orders', label: 'Your Orders' },
  { href: '/account', label: 'Your Account' },
  { href: '/lists', label: 'Your Lists' },
]
