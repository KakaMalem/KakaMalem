import Link from 'next/link'
import Image from 'next/image'
import type { Storefront, Media } from '@/payload-types'

type LogoVariant = 'desktop' | 'mobile' | 'compact' | 'large'
type HeaderDisplay = 'logo_and_name' | 'logo_only' | 'name_only'

interface StoreLogoProps {
  /** The storefront data */
  storefront: Storefront
  /** Size variant for different contexts */
  variant?: LogoVariant
  /** Additional CSS classes */
  className?: string
  /** Disable link behavior (for non-clickable logo usage) */
  asSpan?: boolean
}

const VARIANT_STYLES: Record<LogoVariant, { text: string; image: number }> = {
  large: { text: 'text-3xl', image: 48 },
  desktop: { text: 'text-2xl', image: 40 },
  mobile: { text: 'text-xl', image: 36 },
  compact: { text: 'text-lg', image: 32 },
}

const StoreLogo = ({
  storefront,
  variant = 'desktop',
  className = '',
  asSpan = false,
}: StoreLogoProps) => {
  const styles = VARIANT_STYLES[variant]
  const storeUrl = `/store/${storefront.slug}`

  // Get logo URL
  const logoUrl =
    storefront.logo && typeof storefront.logo === 'object' ? (storefront.logo as Media).url : null

  // Get header display setting (default to logo_and_name for backwards compatibility)
  const headerDisplay: HeaderDisplay =
    (storefront.headerDisplay as HeaderDisplay) || 'logo_and_name'

  // Determine what to show based on headerDisplay setting
  const showLogo = logoUrl && (headerDisplay === 'logo_and_name' || headerDisplay === 'logo_only')
  const showName = headerDisplay === 'logo_and_name' || headerDisplay === 'name_only'

  // If logo_only is selected but no logo exists, fall back to showing name
  const effectiveShowName = showName || (headerDisplay === 'logo_only' && !logoUrl)

  const logoContent = (
    <div className="flex items-center gap-2">
      {showLogo && (
        <Image
          src={logoUrl}
          alt={storefront.name}
          width={styles.image}
          height={styles.image}
          className="rounded-lg object-contain"
        />
      )}
      {effectiveShowName && (
        <span
          className={`
            ${styles.text}
            font-bold
            text-primary
            tracking-wide
            select-none
            ${className}
          `}
        >
          {storefront.name}
        </span>
      )}
    </div>
  )

  if (asSpan) {
    return logoContent
  }

  return (
    <Link
      href={storeUrl}
      className="inline-block transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
      aria-label={`${storefront.name} - صفحه اصلی فروشگاه`}
    >
      {logoContent}
    </Link>
  )
}

export default StoreLogo
