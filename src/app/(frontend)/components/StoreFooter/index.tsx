import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Phone, Mail, Truck } from 'lucide-react'
import type { Storefront, Category, Media } from '@/payload-types'
import { formatPrice } from '@/utilities/currency'

interface StoreFooterProps {
  storefront: Storefront
  categories: Category[]
}

export default function StoreFooter({ storefront, categories }: StoreFooterProps) {
  // Get logo URL
  const logoUrl =
    typeof storefront.logo === 'object' && storefront.logo ? (storefront.logo as Media).url : null

  // Social links
  const socialLinks = storefront.socialLinks || {}
  const hasSocialLinks =
    socialLinks.facebook ||
    socialLinks.instagram ||
    socialLinks.whatsapp ||
    socialLinks.telegram ||
    socialLinks.twitter ||
    socialLinks.tiktok

  // Delivery settings
  const deliverySettings = storefront.deliverySettings || {}
  const deliveryMode = deliverySettings.deliveryMode || 'free_above_threshold'
  const freeDeliveryThreshold = deliverySettings.freeDeliveryThreshold || 1000
  const deliveryFee = deliverySettings.deliveryFee || 50
  const deliveryNote = deliverySettings.deliveryNote

  // Delivery display
  const getDeliveryText = () => {
    switch (deliveryMode) {
      case 'always_free':
        return 'ارسال رایگان'
      case 'free_above_threshold':
        return `ارسال رایگان برای سفارش‌های بالای ${formatPrice(freeDeliveryThreshold, 'AFN')}`
      case 'always_charged':
        return `هزینه ارسال: ${formatPrice(deliveryFee, 'AFN')}`
      default:
        return null
    }
  }

  return (
    <footer className="bg-base-200 text-base-content mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Store Branding */}
          <div>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt={storefront.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              )}
              <span className="font-bold text-xl">{storefront.name}</span>
            </div>
            {storefront.tagline && <p className="mt-2 text-sm opacity-80">{storefront.tagline}</p>}
            {storefront.description && (
              <p className="mt-2 text-sm opacity-70 line-clamp-3">{storefront.description}</p>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="flex items-center gap-3 mt-6">
                {socialLinks.whatsapp && (
                  <a
                    href={`https://wa.me/${socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
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
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="btn btn-ghost btn-sm rounded-full"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="btn btn-ghost btn-sm rounded-full"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {socialLinks.telegram && (
                  <a
                    href={
                      socialLinks.telegram.startsWith('@')
                        ? `https://t.me/${socialLinks.telegram.slice(1)}`
                        : socialLinks.telegram
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    className="btn btn-ghost btn-sm rounded-full"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
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
                )}
              </div>
            )}
          </div>

          {/* Store Categories */}
          {categories.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">دسته‌بندی‌ها</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={`/store/${storefront.slug}`} className="hover:text-primary">
                    همه محصولات
                  </Link>
                </li>
                {categories.slice(0, 5).map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/store/${storefront.slug}/category/${category.slug}`}
                      className="hover:text-primary"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact & Delivery */}
          <div>
            <h4 className="font-semibold mb-3">تماس و ارسال</h4>
            <ul className="space-y-3 text-sm">
              {storefront.contactPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-base-content/60" />
                  <a
                    href={`tel:${storefront.contactPhone}`}
                    className="hover:text-primary"
                    dir="ltr"
                  >
                    {storefront.contactPhone}
                  </a>
                </li>
              )}
              {storefront.contactEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-base-content/60" />
                  <a href={`mailto:${storefront.contactEmail}`} className="hover:text-primary">
                    {storefront.contactEmail}
                  </a>
                </li>
              )}
              {getDeliveryText() && (
                <li className="flex items-center gap-2 mt-4">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-primary font-medium">{getDeliveryText()}</span>
                </li>
              )}
              {deliveryNote && (
                <li className="text-base-content/60 text-xs mr-6">{deliveryNote}</li>
              )}
            </ul>
          </div>
        </div>

        <hr className="my-8 border-base-300" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div className="opacity-80">
            &copy; {new Date().getFullYear()} {storefront.name} — تمامی حقوق محفوظ است.
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs opacity-60">
              ساخته شده با{' '}
              <Link href="/" className="hover:text-primary">
                کاکا معلم
              </Link>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
