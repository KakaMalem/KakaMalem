'use client'
import React, { useState } from 'react'
import { Mail, Facebook, Instagram } from 'lucide-react'
import Logo from './Logo'
import Link from 'next/link'

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // TODO: wire this to your newsletter backend or third-party service.
    // For now we give a friendly UI response.
    setSubscribed(true)
    setTimeout(() => {
      setEmail('')
      setSubscribed(false)
    }, 2500)
  }

  return (
    <footer className="bg-base-200 text-base-content mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Branding + blurb */}
          <div>
            <Logo />
            <p className="mt-4 text-sm opacity-80">
              Online shop for groceries, food, gadgets and more. Fast shipping, honest prices, and
              customer care that actually cares.
            </p>

            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://wa.me/93708133894"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com"
                aria-label="TikTok"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="hover:text-primary">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/shop?filter=deals" className="hover:text-primary">
                  Deals
                </Link>
              </li>
              <li>
                <Link href="/shop?category=electronics" className="hover:text-primary">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/shop?category=fashion" className="hover:text-primary">
                  Fashion
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-primary">
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-primary">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-3">Get 10% off — join our newsletter</h4>
            <p className="text-sm opacity-80 mb-4">
              Subscribe and receive exclusive deals and updates.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="footer-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                aria-live="polite"
                aria-busy={subscribed}
              >
                {subscribed ? (
                  'Subscribed'
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Subscribe
                  </span>
                )}
              </button>
            </form>

            <p className="text-xs opacity-60 mt-3">
              By subscribing you agree to our{' '}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <hr className="my-8 border-base-300" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="opacity-80">
            © {new Date().getFullYear()} Kaka Malem — All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <div className="flex items-center gap-2 text-xs bg-base-100 px-3 py-1 rounded-full border border-base-300">
              <span className="font-semibold text-primary">Free</span>
              <span className="opacity-60">Shipping over AF1000</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
