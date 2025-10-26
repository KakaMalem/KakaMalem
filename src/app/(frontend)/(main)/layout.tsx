import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'payload template',
  description: 'payload template website for کاکا معلم',
  keywords: 'online, shopping, ecommerce, کاکا معلم',
}

export default function MainLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
