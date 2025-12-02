/**
 * Currency conversion utilities
 * Static exchange rate: 1 USD = 66 AFN
 */

export const EXCHANGE_RATE = {
  USD_TO_AFN: 66,
  AFN_TO_USD: 1 / 66,
}

export const CURRENCY_SYMBOLS = {
  AFN: '؋',
  USD: '$',
}

export const FREE_SHIPPING_THRESHOLDS = {
  AFN: 1000,
  USD: 15, // Approximately 1000 AFN
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(amount: number, from: 'USD' | 'AFN', to: 'USD' | 'AFN'): number {
  if (from === to) return amount

  if (from === 'USD' && to === 'AFN') {
    return amount * EXCHANGE_RATE.USD_TO_AFN
  }

  if (from === 'AFN' && to === 'USD') {
    return amount * EXCHANGE_RATE.AFN_TO_USD
  }

  return amount
}

/**
 * Convert amount to AFN (base currency for calculations)
 */
export function toAFN(amount: number, currency: 'USD' | 'AFN'): number {
  return convertCurrency(amount, currency, 'AFN')
}

/**
 * Convert amount to USD
 */
export function toUSD(amount: number, currency: 'USD' | 'AFN'): number {
  return convertCurrency(amount, currency, 'USD')
}

/**
 * Get free shipping threshold for a currency
 */
export function getFreeShippingThreshold(currency: 'USD' | 'AFN'): number {
  return FREE_SHIPPING_THRESHOLDS[currency] || FREE_SHIPPING_THRESHOLDS.AFN
}

/**
 * Check if order qualifies for free shipping
 */
export function qualifiesForFreeShipping(subtotal: number, currency: 'USD' | 'AFN'): boolean {
  const threshold = getFreeShippingThreshold(currency)
  return subtotal >= threshold
}

/**
 * Calculate shipping cost
 */
export function calculateShipping(subtotal: number, currency: 'USD' | 'AFN'): number {
  if (qualifiesForFreeShipping(subtotal, currency)) {
    return 0
  }
  // 10 AFN or equivalent in USD (approximately 0.15 USD)
  return currency === 'AFN' ? 10 : 0.15
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: 'USD' | 'AFN' | string): string {
  if (currency === 'AFN') return CURRENCY_SYMBOLS.AFN
  if (currency === 'USD') return CURRENCY_SYMBOLS.USD
  return currency
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: 'USD' | 'AFN' | string): string {
  const symbol = getCurrencySymbol(currency)
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
  return `${symbol}${formattedAmount}`
}
