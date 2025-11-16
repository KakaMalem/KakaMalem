import React from 'react'
import './styles.css'
import { Providers } from '@/providers'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" data-theme="light">
      <body>
        <Toaster />

        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
