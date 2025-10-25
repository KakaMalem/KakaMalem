'use client'
import React, { useState } from 'react'
import { Mail, Facebook, Twitter, Instagram, Github } from 'lucide-react'

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
            <a href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold select-none">
                K
              </div>
              <span className="font-bold text-lg">Kaka Malem</span>
            </a>
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
                href="https://github.com"
                aria-label="Github"
                className="btn btn-ghost btn-sm rounded-full"
              >
                <Github className="w-5 h-5" />
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
              <span className="opacity-60">Shipping over $50</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
