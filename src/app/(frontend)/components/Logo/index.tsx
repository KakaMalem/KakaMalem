import Link from 'next/link'

interface LogoProps {
  variant?: 'desktop' | 'mobile' | 'icon' | 'full'
  className?: string
}

const Logo = ({ variant = 'desktop', className = '' }: LogoProps) => {
  const config = {
    desktop: { fontSize: 'text-2xl' },
    mobile: { fontSize: 'text-xl' },
    icon: { fontSize: 'text-lg' },
    full: { fontSize: 'text-3xl' },
  }

  const { fontSize } = config[variant]

  return (
    <Link
      href="/"
      className={`inline-block transition-all duration-300 hover:scale-105 ${className}`}
      aria-label="Kakamalem - Home"
    >
      <span
        className={`${fontSize} font-bold text-primary tracking-wide select-none`}
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        کاکا معلم
      </span>
    </Link>
  )
}

export default Logo
