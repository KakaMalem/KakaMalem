import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { serializeRichText } from '@/utilities/serializeRichText'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'تماس با ما',
  description: 'راه‌های ارتباط با فروشگاه کاکا معلم - تلفن، ایمیل، واتساپ و آدرس',
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const payload = await getPayload({ config })

  const contact = await payload.findGlobal({
    slug: 'contact',
  })

  // Serialize the rich text content to HTML
  const contentHtml = contact.content ? serializeRichText(contact.content) : ''

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{contact.title || 'تماس با ما'}</h1>
          {contact.lastUpdated && (
            <p className="text-sm text-base-content/60">
              آخرین بروزرسانی: {new Date(contact.lastUpdated).toLocaleDateString('fa-IR')}
            </p>
          )}
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Email */}
          {contact.email && (
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">ایمیل</h3>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary hover:underline break-all"
                      dir="ltr"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phone */}
          {contact.phone && (
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">شماره تماس</h3>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-primary hover:underline"
                      dir="ltr"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WhatsApp */}
          {contact.whatsapp && (
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">واتساپ</h3>
                    <a
                      href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      dir="ltr"
                    >
                      {contact.whatsapp}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {contact.address && (
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">آدرس</h3>
                    <p className="text-sm whitespace-pre-line">{contact.address}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Content */}
        {contentHtml && (
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
          </div>
        )}
      </div>
    </div>
  )
}
