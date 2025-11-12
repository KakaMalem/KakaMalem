import type { PayloadRequest } from 'payload'

export interface CartData {
  items: Array<{
    productId: string
    quantity: number
    variantId?: string
    addedAt?: string
  }>
}

const CART_COOKIE_NAME = 'guest_cart'
const CART_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

/**
 * Get guest cart from cookies (server-side)
 */
export const getGuestCart = async (req: PayloadRequest): Promise<CartData> => {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = parseCookies(cookieHeader)
    const cartData = cookies[CART_COOKIE_NAME]

    if (!cartData) {
      return { items: [] }
    }

    const decoded = decodeURIComponent(cartData)
    const cart = JSON.parse(decoded)

    return cart && Array.isArray(cart.items) ? cart : { items: [] }
  } catch (error) {
    console.error('Error loading guest cart:', error)
    return { items: [] }
  }
}

/**
 * Save guest cart to cookies (server-side)
 */
export const saveGuestCart = async (req: PayloadRequest, cart: CartData): Promise<void> => {
  try {
    if (!cart || !Array.isArray(cart.items)) {
      cart = { items: [] }
    }

    const encoded = encodeURIComponent(JSON.stringify(cart))
    const cookieValue = `${CART_COOKIE_NAME}=${encoded}; Path=/; Max-Age=${CART_MAX_AGE}; HttpOnly; SameSite=Lax`

    // Store in request context for response handling
    ;(req as any).guestCartCookie = cookieValue
  } catch (error) {
    console.error('Error saving guest cart:', error)
  }
}

/**
 * Clear guest cart (server-side)
 */
export const clearGuestCart = async (req: PayloadRequest): Promise<void> => {
  const cookieValue = `${CART_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
  ;(req as any).guestCartCookie = cookieValue
}

/**
 * Helper to create response with cart cookie
 */
export const createCartResponse = (data: any, status: number, req: PayloadRequest): Response => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const guestCartCookie = (req as any).guestCartCookie
  if (guestCartCookie) {
    headers['Set-Cookie'] = guestCartCookie
  }

  return new Response(JSON.stringify(data), {
    status,
    headers,
  })
}

/**
 * Parse cookie header string into key-value pairs
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=')
    if (name && rest) {
      const value = rest.join('=').trim()
      cookies[name.trim()] = value
    }
  })

  return cookies
}
