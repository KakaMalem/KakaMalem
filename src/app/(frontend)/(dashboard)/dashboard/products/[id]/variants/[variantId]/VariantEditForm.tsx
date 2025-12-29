'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Save,
  Loader2,
  X,
  DollarSign,
  Layers,
  Star,
  Check,
  AlertTriangle,
  Package,
} from 'lucide-react'
import type { ProductVariant, Media } from '@/payload-types'
import { MultiMediaSelector } from '@/app/(frontend)/components/MultiMediaSelector'
import RichTextEditor from '@/app/(frontend)/components/RichTextEditor'
import { htmlToLexical, lexicalToHtml, type LexicalContent } from '@/utilities/serializeRichText'

type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock' | 'on_backorder' | 'discontinued'

interface VariantEditFormProps {
  variant: ProductVariant
  productId: string
  productPrice: number
  productSalePrice?: number
}

interface VariantImage {
  id: string
  url: string
}

// Stock status labels and colors
const stockStatusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  in_stock: { label: 'موجود', class: 'badge-success', icon: <Check className="w-3 h-3" /> },
  out_of_stock: { label: 'ناموجود', class: 'badge-error', icon: <X className="w-3 h-3" /> },
  low_stock: { label: 'کم', class: 'badge-warning', icon: <AlertTriangle className="w-3 h-3" /> },
  on_backorder: {
    label: 'پیش‌سفارش',
    class: 'badge-info',
    icon: <Package className="w-3 h-3" />,
  },
  discontinued: { label: 'توقف', class: 'badge-ghost', icon: <X className="w-3 h-3" /> },
}

// Helper to get description as HTML for rich text editing
const getDescriptionHtml = (description: ProductVariant['description']): string => {
  if (!description) return ''
  // If it's already a string (shouldn't happen but handle it)
  if (typeof description === 'string') return description
  // Convert Lexical content to HTML for editing
  return lexicalToHtml(description as LexicalContent)
}

export default function VariantEditForm({
  variant,
  productId,
  productPrice,
  productSalePrice,
}: VariantEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<{
    price: number | undefined
    compareAtPrice: number | undefined
    sku: string
    description: string
    trackQuantity: boolean
    showStockInFrontend: boolean
    quantity: number
    lowStockThreshold: number
    stockStatus: StockStatus
    allowBackorders: boolean
    isDefault: boolean
  }>({
    price: variant.price ?? undefined,
    compareAtPrice: variant.compareAtPrice ?? undefined,
    sku: variant.sku || '',
    description: getDescriptionHtml(variant.description),
    trackQuantity: variant.trackQuantity ?? true,
    showStockInFrontend: variant.showStockInFrontend ?? true,
    quantity: variant.quantity ?? 0,
    lowStockThreshold: variant.lowStockThreshold ?? 5,
    stockStatus: (variant.stockStatus as StockStatus) || 'in_stock',
    allowBackorders: variant.allowBackorders ?? false,
    isDefault: variant.isDefault ?? false,
  })
  const [images, setImages] = useState<VariantImage[]>([])

  // Extract images from variant
  useEffect(() => {
    if (variant?.images) {
      const variantImages = (Array.isArray(variant.images) ? variant.images : [variant.images])
        .map((img) => {
          if (typeof img === 'object' && img !== null) {
            return { id: (img as Media).id, url: (img as Media).url || '' }
          }
          return null
        })
        .filter((img): img is VariantImage => img !== null && !!img.url)
      setImages(variantImages)
    } else {
      setImages([])
    }
  }, [variant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Convert HTML description to Lexical format for richText field
      const descriptionLexical = formData.description ? htmlToLexical(formData.description) : null

      const res = await fetch(`/api/product-variants/${variant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          description: descriptionLexical,
          images: images.map((img) => img.id),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.errors?.[0]?.message || 'خطا در ذخیره')
      }

      toast.success('تنوع با موفقیت ذخیره شد')
      router.push(`/dashboard/products/${productId}?tab=variants`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره تنوع')
    } finally {
      setIsLoading(false)
    }
  }

  const variantTitle = variant.options?.map((o) => o.value).join(' / ') || 'تنوع'
  const effectivePrice = formData.price ?? productSalePrice ?? productPrice
  const effectiveComparePrice =
    formData.compareAtPrice ?? (formData.price ? productPrice : undefined)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0">
      {/* Variant Title Card */}
      <div className="card bg-base-200 w-full">
        <div className="card-body p-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="text-lg sm:text-2xl font-bold truncate">{variantTitle}</div>
              {variant.isDefault && (
                <span className="badge badge-warning gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 fill-current" />
                  پیش‌فرض
                </span>
              )}
            </div>
            <div
              className={`badge ${stockStatusConfig[formData.stockStatus]?.class || ''} gap-1 self-start sm:self-auto flex-shrink-0`}
            >
              {stockStatusConfig[formData.stockStatus]?.icon}
              {stockStatusConfig[formData.stockStatus]?.label}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="card bg-base-200 w-full">
        <div className="card-body space-y-4 min-w-0">
          <div className="flex items-center gap-2 text-lg font-medium">
            <DollarSign className="w-5 h-5" />
            قیمت‌گذاری
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">قیمت فروش</span>
              </label>
              <div className="join w-full">
                <input
                  type="number"
                  value={formData.price ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="input input-bordered join-item flex-1 min-w-0"
                  placeholder={`پیش‌فرض: ${productSalePrice || productPrice}`}
                  min={0}
                />
                <span className="btn btn-disabled join-item">؋</span>
              </div>
              <label className="label">
                <span className="label-text-alt text-base-content/60 whitespace-normal break-words">
                  خالی بگذارید تا از قیمت محصول استفاده شود
                </span>
              </label>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">قیمت قبلی (خط‌خورده)</span>
              </label>
              <div className="join w-full">
                <input
                  type="number"
                  value={formData.compareAtPrice ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="input input-bordered join-item flex-1 min-w-0"
                  placeholder="اختیاری"
                  min={0}
                />
                <span className="btn btn-disabled join-item">؋</span>
              </div>
            </div>
          </div>

          <div className="alert alert-info py-2">
            <span>
              قیمت نمایشی: <strong>{effectivePrice.toLocaleString()} ؋</strong>
              {effectiveComparePrice && effectiveComparePrice > effectivePrice && (
                <span className="line-through mr-2 opacity-60">
                  {effectiveComparePrice.toLocaleString()} ؋
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* SKU & Description */}
      <div className="card bg-base-200 w-full">
        <div className="card-body space-y-4 min-w-0">
          <h3 className="text-lg font-medium">اطلاعات تنوع</h3>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">شناسه (SKU)</span>
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="input input-bordered w-full"
              dir="ltr"
              placeholder="PROD-001-RED-L"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-medium">توضیحات تنوع</span>
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="توضیحات خاص این تنوع (مثلاً دستورات مراقبتی خاص این رنگ)"
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60 whitespace-normal break-words">
                این توضیحات در صفحه محصول نمایش داده می‌شود وقتی این تنوع انتخاب شود
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="card bg-base-200 w-full">
        <div className="card-body space-y-4 min-w-0">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Layers className="w-5 h-5" />
            موجودی
          </div>

          <label className="flex items-start cursor-pointer gap-4">
            <input
              type="checkbox"
              checked={formData.trackQuantity}
              onChange={(e) => setFormData({ ...formData, trackQuantity: e.target.checked })}
              className="toggle toggle-primary flex-shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <span className="label-text font-medium">ردیابی موجودی</span>
              <p className="text-xs text-base-content/60 mt-1 break-words">
                وضعیت موجودی خودکار بر اساس تعداد محاسبه می‌شود
              </p>
            </div>
          </label>

          {formData.trackQuantity && (
            <label className="flex items-start cursor-pointer gap-4">
              <input
                type="checkbox"
                checked={formData.showStockInFrontend}
                onChange={(e) =>
                  setFormData({ ...formData, showStockInFrontend: e.target.checked })
                }
                className="toggle toggle-primary flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <span className="label-text font-medium">نمایش موجودی به مشتریان</span>
                <p className="text-xs text-base-content/60 mt-1 break-words">
                  غیرفعال کنید تا موجودی از دید مشتریان پنهان شود (ردیابی داخلی ادامه می‌یابد)
                </p>
              </div>
            </label>
          )}

          {formData.trackQuantity ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">تعداد موجودی</span>
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="input input-bordered w-full"
                  min={0}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">آستانه هشدار کم بودن</span>
                </label>
                <input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowStockThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input input-bordered w-full"
                  min={0}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-start cursor-pointer gap-4">
                  <input
                    type="checkbox"
                    checked={formData.allowBackorders}
                    onChange={(e) =>
                      setFormData({ ...formData, allowBackorders: e.target.checked })
                    }
                    className="checkbox checkbox-primary flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="label-text font-medium">قبول پیش‌سفارش</span>
                    <p className="text-xs text-base-content/60 mt-1 break-words">
                      اجازه سفارش وقتی موجودی صفر است
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <select
              value={formData.stockStatus}
              onChange={(e) =>
                setFormData({ ...formData, stockStatus: e.target.value as StockStatus })
              }
              className="select select-bordered w-full mt-4"
            >
              {Object.entries(stockStatusConfig).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="card bg-base-200 w-full">
        <div className="card-body space-y-4 min-w-0">
          <MultiMediaSelector
            value={images}
            onChange={setImages}
            label="تصاویر تنوع"
            description="این تصاویر هنگام انتخاب این تنوع نمایش داده می‌شوند. اولین تصویر، تصویر اصلی تنوع خواهد بود. برای تغییر ترتیب، بکشید."
            maxItems={10}
            allowUpload={true}
            allowLibrarySelection={true}
            allowReorder={true}
          />
        </div>
      </div>

      {/* Default Variant Toggle */}
      <div className="card bg-base-200 w-full">
        <div className="card-body min-w-0">
          <label className="label cursor-pointer justify-start gap-4 flex-nowrap">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="checkbox checkbox-warning flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning flex-shrink-0" />
                <span className="label-text font-medium">تنوع پیش‌فرض</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 bg-base-200 rounded-lg sticky bottom-0 w-full">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/products/${productId}?tab=variants`)}
          className="btn btn-ghost order-2 sm:order-1"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary gap-2 order-1 sm:order-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              ذخیره تغییرات
            </>
          )}
        </button>
      </div>
    </form>
  )
}
