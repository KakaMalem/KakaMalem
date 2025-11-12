import { Metadata } from 'next'
import CartPageClient from './page.client'

export const metadata: Metadata = {
  title: 'Shopping Cart | Your Store',
  description: 'View and manage your shopping cart items',
}

export default async function CartPage() {
  // Server component - can fetch initial data here if needed
  // For now, we let the client component handle cart state via context

  return <CartPageClient />
}
