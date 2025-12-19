import React from 'react'
import './styles.css'
import { Providers } from '@/providers'
import { Toaster } from 'react-hot-toast'
import { Rubik } from 'next/font/google'
import { cn } from '@/utilities/ui'
import type { Metadata } from 'next'

export const rubik = Rubik({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
})

const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://kakamalem.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'کاکا معلم',
    template: '%s | کاکا معلم',
  },
  description: 'فروشگاه اینترنتی کاکا معلم - خرید آنلاین محصولات با کیفیت با ارسال سریع در کابل',
  keywords: [
    'فروشگاه اینترنتی',
    'خرید آنلاین',
    'کاکا معلم',
    'کابل',
    'افغانستان',
    'محصولات با کیفیت',
  ],
  authors: [{ name: 'کاکا معلم' }],
  creator: 'کاکا معلم',
  publisher: 'کاکا معلم',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fa_AF',
    url: siteUrl,
    siteName: 'کاکا معلم',
    title: 'کاکا معلم | فروشگاه اینترنتی',
    description: 'فروشگاه اینترنتی کاکا معلم - خرید آنلاین محصولات با کیفیت با ارسال سریع در کابل',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'کاکا معلم - فروشگاه اینترنتی',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'کاکا معلم | فروشگاه اینترنتی',
    description: 'فروشگاه اینترنتی کاکا معلم - خرید آنلاین محصولات با کیفیت',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when ready
    // google: 'your-google-verification-code',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html className={cn(rubik.className)} lang="fa" dir="rtl" data-theme="kakamalem">
      <body>
        <Toaster position="bottom-center" />

        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
