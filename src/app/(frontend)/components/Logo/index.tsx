import Link from 'next/link'

type LogoVariant = 'desktop' | 'mobile' | 'compact' | 'large'

interface LogoProps {
  /** Size variant for different contexts */
  variant?: LogoVariant
  /** Additional CSS classes */
  className?: string
  /** Disable link behavior (for non-clickable logo usage) */
  asSpan?: boolean
}

const VARIANT_STYLES: Record<LogoVariant, string> = {
  large: 'text-3xl',
  desktop: 'text-2xl',
  mobile: 'text-xl',
  compact: 'text-lg',
}

const Logo = ({ variant = 'desktop', className = '', asSpan = false }: LogoProps) => {
  const sizeClass = VARIANT_STYLES[variant]

  const logoContent = (
    <span
      className={`
        ${sizeClass}
        font-bold
        text-primary
        tracking-wide
        select-none
        ${className}
      `}
    >
      کاکا معلم
    </span>
  )

  if (asSpan) {
    return logoContent
  }

  return (
    <Link
      href="/"
      className="inline-block transition-transform duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
      aria-label="کاکا معلم - صفحه اصلی"
    >
      {logoContent}
    </Link>
  )
}

export default Logo
