import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { serializeRichText } from '@/utilities/serializeRichText'

export const metadata: Metadata = {
  title: 'سوالات متداول',
  description: 'پاسخ سوالات متداول درباره خرید، ارسال و خدمات فروشگاه کاکا معلم',
}

export const dynamic = 'force-dynamic'

export default async function FAQsPage() {
  const payload = await getPayload({ config })

  const faqs = await payload.findGlobal({
    slug: 'faqs',
  })

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{faqs.title || 'سوالات متداول'}</h1>
          {faqs.lastUpdated && (
            <p className="text-sm text-base-content/60">
              آخرین بروزرسانی: {new Date(faqs.lastUpdated).toLocaleDateString('fa-IR')}
            </p>
          )}
        </div>

        {/* FAQ Items */}
        {faqs.items && faqs.items.length > 0 ? (
          <div className="space-y-4">
            {faqs.items.map((item, index) => {
              const answerHtml = item.answer ? serializeRichText(item.answer) : ''
              return (
                <div key={index} className="collapse collapse-plus bg-base-200">
                  <input type="radio" name="faq-accordion" defaultChecked={index === 0} />
                  <div className="collapse-title text-lg font-semibold">{item.question}</div>
                  <div className="collapse-content">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: answerHtml }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>سوالات متداول هنوز تنظیم نشده است.</span>
          </div>
        )}
      </div>
    </div>
  )
}
