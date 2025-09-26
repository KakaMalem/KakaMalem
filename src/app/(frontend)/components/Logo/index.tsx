import Link from 'next/link'

interface LogoProps {
  variant?: 'desktop' | 'mobile' | 'icon' | 'full'
  className?: string
}

const Logo = ({ variant = 'desktop', className = '' }: LogoProps) => {
  const config = {
    desktop: { width: 140, height: 36, fontSize: 18, iconSize: 28, spacing: 12 },
    mobile: { width: 120, height: 32, fontSize: 16, iconSize: 24, spacing: 10 },
    icon: { width: 32, height: 32, fontSize: 0, iconSize: 28, spacing: 0 },
    full: { width: 180, height: 48, fontSize: 22, iconSize: 36, spacing: 16 },
  }

  const { width, height, fontSize, iconSize, spacing } = config[variant]
  const showText = variant !== 'icon'
  const iconX = 2
  const textX = showText ? iconSize + spacing : 0

  return (
    <Link
      href="/"
      className={`inline-block group transition-all duration-300 hover:scale-105 hover:brightness-110 ${className}`}
      aria-label="Kakamalem - Home"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="select-none drop-shadow-sm"
        role="img"
        aria-labelledby="logo-title"
      >
        <title id="logo-title">Kakamalem Logo</title>
        <defs>
          <linearGradient id={`logoGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="stop-color-primary" stopOpacity="1" />
            <stop offset="50%" className="stop-color-secondary" stopOpacity="0.9" />
            <stop offset="100%" className="stop-color-accent" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id={`textGradient-${variant}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className="stop-color-base-content" stopOpacity="0.95" />
            <stop offset="100%" className="stop-color-primary" stopOpacity="0.85" />
          </linearGradient>

          <filter id={`glow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="group-hover:animate-pulse">
          <circle
            cx={iconX + iconSize / 2}
            cy={height / 2}
            r={iconSize / 2 - 2}
            fill={`url(#logoGradient-${variant})`}
            className="transition-all duration-300"
            filter={`url(#glow-${variant})`}
          />

          <g transform={`translate(${iconX + iconSize / 2}, ${height / 2})`}>
            <path
              d="M-8,-8 L8,-8 L8,8 L-8,8 Z M-4,-4 L4,-4 L4,4 L-4,4 Z"
              fill="white"
              fillRule="evenodd"
              opacity="0.9"
              className="transition-all duration-300 group-hover:opacity-100"
            />
            <circle
              cx="0"
              cy="0"
              r="2"
              fill="white"
              opacity="0.8"
              className="transition-all duration-300 group-hover:opacity-100 group-hover:r-3"
            />
          </g>
        </g>

        {showText && (
          <text
            x={textX}
            y={height / 2 + fontSize / 3}
            fontSize={fontSize}
            fontWeight="600"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
            letterSpacing="-0.02em"
            fill={`url(#textGradient-${variant})`}
            className="transition-all duration-300 group-hover:fill-primary"
          >
            kakamalem
          </text>
        )}
      </svg>
    </Link>
  )
}

export default Logo
