'use client'
import React, { useState } from 'react'
import { Mail, Facebook, Twitter, Instagram } from 'lucide-react'
import Logo from './Logo'

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
                href="https://facebook.com"
                aria-label="Facebook"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <Twitter className="w-5 h-5" />
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
                <a href="/shop" className="hover:text-primary">
                  All products
                </a>
              </li>
              <li>
                <a href="/shop?filter=deals" className="hover:text-primary">
                  Deals
                </a>
              </li>
              <li>
                <a href="/shop?category=electronics" className="hover:text-primary">
                  Electronics
                </a>
              </li>
              <li>
                <a href="/shop?category=fashion" className="hover:text-primary">
                  Fashion
                </a>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/help" className="hover:text-primary">
                  Help Centre
                </a>
              </li>
              <li>
                <a href="/shipping" className="hover:text-primary">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-primary">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/faqs" className="hover:text-primary">
                  FAQs
                </a>
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
              <a href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </a>
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
            <a href="/terms" className="hover:text-primary">
              Terms
            </a>
            <a href="/privacy" className="hover:text-primary">
              Privacy
            </a>
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
