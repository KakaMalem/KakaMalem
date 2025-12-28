'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  Save,
  Loader2,
  X,
  ImageIcon,
  GripVertical,
  Upload,
  DollarSign,
  Layers,
  Star,
  Check,
  AlertTriangle,
  Package,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProductVariant, Media } from '@/payload-types'
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

// Sortable Image Component
interface SortableVariantImageProps {
  image: VariantImage
  onRemove: (id: string) => void
}

function SortableVariantImage({ image, onRemove }: SortableVariantImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className={`aspect-square rounded-lg overflow-hidden bg-base-300 ${isDragging ? 'ring-2 ring-primary' : ''}`}
      >
        <Image
          src={image.url}
          alt="Variant image"
          width={120}
          height={120}
          className="w-full h-full object-cover"
        />
      </div>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 btn btn-circle btn-xs bg-base-100/80 hover:bg-base-100 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute top-2 right-2 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
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
    quantity: variant.quantity ?? 0,
    lowStockThreshold: variant.lowStockThreshold ?? 5,
    stockStatus: (variant.stockStatus as StockStatus) || 'in_stock',
    allowBackorders: variant.allowBackorders ?? false,
    isDefault: variant.isDefault ?? false,
  })
  const [images, setImages] = useState<VariantImage[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)

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

  // Drag and drop sensors
  const imageSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    setImages(arrayMove(images, oldIndex, newIndex))
  }

  const handleImageRemove = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingImage(true)
    try {
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('alt', 'Variant image')

        const res = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        })

        if (!res.ok) {
          throw new Error('آپلود تصویر ناموفق بود')
        }

        const data = await res.json()
        if (data.doc) {
          setImages((prev) => [...prev, { id: data.doc.id, url: data.doc.url }])
        }
      }
      toast.success('تصاویر آپلود شدند')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'خطا در آپلود تصویر')
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Variant Title Card */}
      <div className="card bg-base-200">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold">{variantTitle}</div>
              {variant.isDefault && (
                <span className="badge badge-warning gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  پیش‌فرض
                </span>
              )}
            </div>
            <div className={`badge ${stockStatusConfig[formData.stockStatus]?.class || ''} gap-1`}>
              {stockStatusConfig[formData.stockStatus]?.icon}
              {stockStatusConfig[formData.stockStatus]?.label}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <DollarSign className="w-5 h-5" />
            قیمت‌گذاری
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">قیمت فروش</legend>
              <div className="input-group">
                <input
                  type="number"
                  value={formData.price ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder={`پیش‌فرض: ${productSalePrice || productPrice}`}
                  min={0}
                />
                <span className="bg-base-300 px-4 flex items-center">؋</span>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                خالی بگذارید تا از قیمت محصول استفاده شود
              </p>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">قیمت قبلی (خط‌خورده)</legend>
              <div className="input-group">
                <input
                  type="number"
                  value={formData.compareAtPrice ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="input input-bordered w-full"
                  placeholder="اختیاری"
                  min={0}
                />
                <span className="bg-base-300 px-4 flex items-center">؋</span>
              </div>
            </fieldset>
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
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          <h3 className="text-lg font-medium">اطلاعات تنوع</h3>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">شناسه (SKU)</legend>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="input input-bordered w-full max-w-md"
              dir="ltr"
              placeholder="PROD-001-RED-L"
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">توضیحات تنوع</legend>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="توضیحات خاص این تنوع (مثلاً دستورات مراقبتی خاص این رنگ)"
            />
            <p className="text-xs text-base-content/60 mt-1">
              این توضیحات در صفحه محصول نمایش داده می‌شود وقتی این تنوع انتخاب شود
            </p>
          </fieldset>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Layers className="w-5 h-5" />
            موجودی
          </div>

          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              checked={formData.trackQuantity}
              onChange={(e) => setFormData({ ...formData, trackQuantity: e.target.checked })}
              className="toggle toggle-primary"
            />
            <div>
              <span className="label-text font-medium">ردیابی موجودی</span>
              <p className="text-xs text-base-content/60">
                وضعیت موجودی خودکار بر اساس تعداد محاسبه می‌شود
              </p>
            </div>
          </label>

          {formData.trackQuantity ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">تعداد موجودی</legend>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
                  className="input input-bordered w-full"
                  min={0}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">آستانه هشدار کم بودن</legend>
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
              </fieldset>

              <div className="md:col-span-2">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    checked={formData.allowBackorders}
                    onChange={(e) =>
                      setFormData({ ...formData, allowBackorders: e.target.checked })
                    }
                    className="checkbox checkbox-primary"
                  />
                  <div>
                    <span className="label-text font-medium">قبول پیش‌سفارش</span>
                    <p className="text-xs text-base-content/60">اجازه سفارش وقتی موجودی صفر است</p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <fieldset className="fieldset pt-4">
              <legend className="fieldset-legend">وضعیت موجودی</legend>
              <select
                value={formData.stockStatus}
                onChange={(e) =>
                  setFormData({ ...formData, stockStatus: e.target.value as StockStatus })
                }
                className="select select-bordered w-full max-w-xs"
              >
                {Object.entries(stockStatusConfig).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </fieldset>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <ImageIcon className="w-5 h-5" />
            تصاویر تنوع
          </div>

          <DndContext
            sensors={imageSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleImageDragEnd}
          >
            <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="relative">
                    {index === 0 && images.length > 0 && (
                      <div className="absolute -top-2 -right-2 z-10 badge badge-primary badge-sm">
                        اصلی
                      </div>
                    )}
                    <SortableVariantImage image={image} onRemove={handleImageRemove} />
                  </div>
                ))}

                {/* Upload button */}
                <label className="aspect-square rounded-lg border-2 border-dashed border-base-content/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-base-300/50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin text-base-content/40" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-base-content/40" />
                      <span className="text-xs text-base-content/40 mt-1">افزودن</span>
                    </>
                  )}
                </label>
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-xs text-base-content/60">
            تصاویر این تنوع وقتی انتخاب شود نمایش داده می‌شوند. تصویر اول به عنوان تصویر اصلی نمایش
            داده می‌شود.
          </p>
        </div>
      </div>

      {/* Default Variant Toggle */}
      <div className="card bg-base-200">
        <div className="card-body">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="checkbox checkbox-warning"
            />
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning" />
                <span className="label-text font-medium">تنوع پیش‌فرض</span>
              </div>
              <p className="text-xs text-base-content/60">
                این تنوع هنگام باز شدن صفحه محصول به صورت پیش‌فرض انتخاب شده باشد
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-between gap-4 p-4 bg-base-200 rounded-lg sticky bottom-0">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/products/${productId}?tab=variants`)}
          className="btn btn-ghost"
        >
          انصراف
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary gap-2">
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
