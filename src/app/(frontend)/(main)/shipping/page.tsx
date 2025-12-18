import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { serializeRichText } from '@/utilities/serializeRichText'

export const metadata: Metadata = {
  title: 'ارسال و بازگشت',
  description: 'اطلاعات ارسال، تحویل و سیاست بازگشت کالا در فروشگاه کاکا معلم',
}

export const dynamic = 'force-dynamic'

export default async function ShippingPage() {
  const payload = await getPayload({ config })

  const shipping = await payload.findGlobal({
    slug: 'shipping',
  })

  // Serialize the rich text content to HTML
  const contentHtml = shipping.content ? serializeRichText(shipping.content) : ''

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{shipping.title || 'ارسال و بازگشت'}</h1>
          {shipping.lastUpdated && (
            <p className="text-sm text-base-content/60">
              آخرین بروزرسانی: {new Date(shipping.lastUpdated).toLocaleDateString('fa-IR')}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          {contentHtml ? (
            <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
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
              <span>محتوای ارسال و بازگشت هنوز تنظیم نشده است.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
