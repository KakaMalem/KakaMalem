'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Package,
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { ProductVariant, Media } from '@/payload-types'

interface VariantManagerProps {
  productId: string
  productPrice: number
  productSalePrice?: number
  onVariantsChange?: () => void
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

// Main Variant Manager Component
export default function VariantManager({
  productId,
  productPrice,
  productSalePrice,
  onVariantsChange,
}: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

  // Fetch variants
  const fetchVariants = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/variants/product/${productId}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setVariants(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching variants:', error)
      toast.error('خطا در بارگذاری تنوع‌ها')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchVariants()
    }
  }, [productId, fetchVariants])

  // Toggle variant selection
  const toggleSelection = (variantId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedIds.size === variants.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(variants.map((v) => v.id)))
    }
  }

  // Toggle expanded variant
  const toggleExpanded = (variantId: string) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }

  // Delete variant
  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('آیا از حذف این تنوع مطمئن هستید؟')) return

    try {
      const res = await fetch(`/api/product-variants/${variantId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('خطا در حذف')
      }

      toast.success('تنوع حذف شد')
      await fetchVariants()
      onVariantsChange?.()
    } catch (_error) {
      toast.error('خطا در حذف تنوع')
    }
  }

  // Delete selected variants
  const handleDeleteSelected = async () => {
    if (!confirm(`آیا از حذف ${selectedIds.size} تنوع مطمئن هستید؟`)) return

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/product-variants/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          }),
        ),
      )

      toast.success(`${selectedIds.size} تنوع حذف شد`)
      setSelectedIds(new Set())
      await fetchVariants()
      onVariantsChange?.()
    } catch (_error) {
      toast.error('خطا در حذف تنوع‌ها')
    }
  }

  // Get variant image
  const getVariantImage = (variant: ProductVariant): string | null => {
    if (!variant.images || !Array.isArray(variant.images) || variant.images.length === 0) {
      return null
    }
    const firstImage = variant.images[0]
    if (typeof firstImage === 'object' && firstImage !== null) {
      return (firstImage as Media).url || null
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto text-base-content/30 mb-4" />
        <p className="text-base-content/60">هنوز تنوعی ایجاد نشده</p>
        <p className="text-sm text-base-content/40 mt-1">
          ابتدا گزینه‌های تنوع را تعریف کرده و محصول را ذخیره کنید
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/60">{variants.length} تنوع</span>
          {selectedIds.size > 0 && (
            <span className="badge badge-primary badge-sm">{selectedIds.size} انتخاب شده</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="btn btn-sm btn-ghost text-error gap-1"
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </button>
          )}
          <button type="button" onClick={fetchVariants} className="btn btn-sm btn-ghost gap-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Variants List */}
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-base-200 rounded-lg text-sm font-medium">
          <input
            type="checkbox"
            checked={selectedIds.size === variants.length}
            onChange={toggleAllSelection}
            className="checkbox checkbox-sm"
          />
          <div className="flex-1">تنوع</div>
          <div className="w-24 text-center hidden sm:block">قیمت</div>
          <div className="w-20 text-center hidden sm:block">موجودی</div>
          <div className="w-24 text-center hidden sm:block">وضعیت</div>
          <div className="w-20"></div>
        </div>

        {/* Variant Rows */}
        {variants.map((variant) => {
          const isSelected = selectedIds.has(variant.id)
          const isExpanded = expandedVariants.has(variant.id)
          const imageUrl = getVariantImage(variant)
          const variantTitle = variant.options?.map((o) => o.value).join(' / ') || 'تنوع'
          const effectivePrice = variant.price ?? productSalePrice ?? productPrice
          const stockConfig = stockStatusConfig[variant.stockStatus || 'in_stock']
          const imageCount = Array.isArray(variant.images) ? variant.images.length : 0

          return (
            <div
              key={variant.id}
              className={`bg-base-200 rounded-lg overflow-hidden transition-colors ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Main Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(variant.id)}
                  className="checkbox checkbox-sm"
                />

                {/* Image & Title */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-base-300 flex-shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={variantTitle}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-base-content/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{variantTitle}</span>
                      {variant.isDefault && (
                        <Star className="w-3 h-3 text-warning fill-warning flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-base-content/60 truncate">
                      SKU: {variant.sku}
                      {imageCount > 0 && <span className="mr-2">• {imageCount} تصویر</span>}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="w-24 text-center hidden sm:block">
                  <span className="text-sm font-medium">{effectivePrice.toLocaleString()} ؋</span>
                  {variant.price && <span className="text-xs text-success block">سفارشی</span>}
                </div>

                {/* Quantity */}
                <div className="w-20 text-center hidden sm:block">
                  {variant.trackQuantity ? (
                    <span className="text-sm">{variant.quantity || 0}</span>
                  ) : (
                    <span className="text-xs text-base-content/40">—</span>
                  )}
                </div>

                {/* Status */}
                <div className="w-24 text-center hidden sm:block">
                  <span className={`badge badge-sm ${stockConfig.class} gap-1`}>
                    {stockConfig.icon}
                    {stockConfig.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/products/${productId}/variants/${variant.id}`}
                    className="btn btn-ghost btn-sm btn-square"
                    title="ویرایش"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariant(variant.id)}
                    className="btn btn-ghost btn-sm btn-square text-error"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(variant.id)}
                    className="btn btn-ghost btn-sm btn-square sm:hidden"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Mobile Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 grid grid-cols-3 gap-2 sm:hidden border-t border-base-300 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-base-content/60">قیمت</p>
                    <p className="text-sm font-medium">{effectivePrice.toLocaleString()} ؋</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/60">موجودی</p>
                    <p className="text-sm">{variant.trackQuantity ? variant.quantity || 0 : '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-base-content/60">وضعیت</p>
                    <span className={`badge badge-sm ${stockConfig.class} gap-1 mt-1`}>
                      {stockConfig.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
