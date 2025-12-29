'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Package,
  DollarSign,
  Layers,
  Settings,
  Save,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  GripVertical,
  X,
} from 'lucide-react'
import type { Product, Category, Media } from '@/payload-types'
import { MultiMediaSelector } from '@/app/(frontend)/components/MultiMediaSelector'
import RichTextEditor from '@/app/(frontend)/components/RichTextEditor'
import { htmlToLexical, lexicalToHtml, type LexicalContent } from '@/utilities/serializeRichText'
import VariantManager from './VariantManager'

interface ProductFormProps {
  product: Product | null
  categories: Category[]
  storefrontId?: string
}

type ProductImage = {
  id: string
  url: string
}

type VariantOption = {
  name: string
  values: { value: string; image?: string | null }[]
}

export default function ProductForm({ product, categories, storefrontId }: ProductFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Get initial tab from URL query parameter
  const getInitialTab = (): 'basic' | 'pricing' | 'inventory' | 'variants' => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'pricing' || tabParam === 'inventory' || tabParam === 'variants') {
      return tabParam
    }
    return 'basic'
  }

  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'variants'>(
    getInitialTab(),
  )

  // Helper to extract images from product
  const getProductImages = (): ProductImage[] => {
    if (!product?.images) return []
    const images = Array.isArray(product.images) ? product.images : [product.images]
    return images
      .map((img) => {
        if (typeof img === 'object' && img !== null) {
          return { id: (img as Media).id, url: (img as Media).url || '' }
        }
        return null
      })
      .filter((img): img is ProductImage => img !== null && !!img.url)
  }

  // Helper to get description as HTML for rich text editing
  const getDescriptionHtml = (): string => {
    if (!product?.description) return ''
    // If it's already a string (shouldn't happen but handle it)
    if (typeof product.description === 'string') return product.description
    // Convert Lexical content to HTML for editing
    return lexicalToHtml(product.description as LexicalContent)
  }

  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    name: product?.name || '',
    shortDescription: product?.shortDescription || '',
    description: getDescriptionHtml(),
    slug: product?.slug || '',
    // Pricing
    price: product?.price || 0,
    salePrice: product?.salePrice || undefined,
    sku: product?.sku || '',
    // Inventory
    trackQuantity: product?.trackQuantity ?? true,
    showStockInFrontend: product?.showStockInFrontend ?? true,
    quantity: product?.quantity || 0,
    lowStockThreshold: product?.lowStockThreshold || 5,
    stockStatus: product?.stockStatus || 'in_stock',
    allowBackorders: product?.allowBackorders || false,
    // Variants
    hasVariants: product?.hasVariants || false,
    variantOptions: (product?.variantOptions as VariantOption[]) || [],
    // Publishing
    _status: product?._status || 'draft',
  })

  // Images state
  const [images, setImages] = useState<ProductImage[]>(getProductImages())

  // Selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (!product?.categories) return []
    return product.categories
      .map((cat) => (typeof cat === 'object' ? cat.id : cat))
      .filter((id): id is string => !!id)
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  // Variant options management
  const addVariantOption = () => {
    setFormData((prev) => ({
      ...prev,
      variantOptions: [...prev.variantOptions, { name: '', values: [{ value: '' }] }],
    }))
  }

  const removeVariantOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variantOptions: prev.variantOptions.filter((_, i) => i !== index),
    }))
  }

  const updateVariantOptionName = (index: number, name: string) => {
    setFormData((prev) => ({
      ...prev,
      variantOptions: prev.variantOptions.map((opt, i) => (i === index ? { ...opt, name } : opt)),
    }))
  }

  const addVariantValue = (optionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variantOptions: prev.variantOptions.map((opt, i) =>
        i === optionIndex ? { ...opt, values: [...opt.values, { value: '' }] } : opt,
      ),
    }))
  }

  const removeVariantValue = (optionIndex: number, valueIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      variantOptions: prev.variantOptions.map((opt, i) =>
        i === optionIndex
          ? { ...opt, values: opt.values.filter((_, vi) => vi !== valueIndex) }
          : opt,
      ),
    }))
  }

  const updateVariantValue = (optionIndex: number, valueIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      variantOptions: prev.variantOptions.map((opt, i) =>
        i === optionIndex
          ? {
              ...opt,
              values: opt.values.map((v, vi) => (vi === valueIndex ? { ...v, value } : v)),
            }
          : opt,
      ),
    }))
  }

  // Generate SKU from product name
  const generateSku = () => {
    const name = formData.name.trim()
    if (!name) {
      toast.error('لطفا ابتدا نام محصول را وارد کنید')
      return
    }

    // Create SKU from first letters of words + random number
    const words = name.split(/\s+/).filter(Boolean)
    const prefix = words
      .slice(0, 3)
      .map((word) => {
        // Use first 2 characters, transliterate Persian/Arabic to Latin
        const translitMap: Record<string, string> = {
          ا: 'A',
          آ: 'A',
          ب: 'B',
          پ: 'P',
          ت: 'T',
          ث: 'S',
          ج: 'J',
          چ: 'C',
          ح: 'H',
          خ: 'KH',
          د: 'D',
          ذ: 'Z',
          ر: 'R',
          ز: 'Z',
          ژ: 'ZH',
          س: 'S',
          ش: 'SH',
          ص: 'S',
          ض: 'Z',
          ط: 'T',
          ظ: 'Z',
          ع: 'A',
          غ: 'GH',
          ف: 'F',
          ق: 'Q',
          ک: 'K',
          گ: 'G',
          ل: 'L',
          م: 'M',
          ن: 'N',
          و: 'V',
          ه: 'H',
          ی: 'Y',
          ي: 'Y',
          ة: 'H',
          ء: 'A',
          ئ: 'Y',
          ؤ: 'V',
        }
        return word
          .slice(0, 2)
          .split('')
          .map((char) => translitMap[char] || char.toUpperCase())
          .join('')
      })
      .join('')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()

    // Add random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const sku = `${prefix || 'PRD'}-${randomNum}`

    setFormData((prev) => ({ ...prev, sku }))
    toast.success('شناسه محصول ایجاد شد')
  }

  const handleSubmit = async (e: React.FormEvent, publishStatus?: 'draft' | 'published') => {
    e.preventDefault()
    setIsLoading(true)

    // Determine the status to use
    const statusToUse = publishStatus || formData._status

    try {
      const endpoint = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PATCH' : 'POST'

      // Generate slug from name if not provided
      const slug =
        formData.slug ||
        formData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

      // Convert HTML description to Lexical format for richText field
      const descriptionLexical = formData.description ? htmlToLexical(formData.description) : null

      // Build stores array - include the user's storefront
      const storesArray: string[] = []
      if (storefrontId) {
        storesArray.push(storefrontId)
      }
      // If editing, preserve existing stores (in case admin added more)
      if (product?.stores) {
        const existingStores = (product.stores as Array<string | { id: string }>).map((s) =>
          typeof s === 'object' ? s.id : s,
        )
        existingStores.forEach((storeId) => {
          if (!storesArray.includes(storeId)) {
            storesArray.push(storeId)
          }
        })
      }

      // Auto-generate SKU if empty
      let finalSku = formData.sku
      if (!finalSku || finalSku.trim() === '') {
        const randomNum = Math.floor(100000 + Math.random() * 900000)
        const prefix = formData.name
          .split(' ')[0]
          .substring(0, 3)
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
        finalSku = `${prefix || 'PRD'}-${randomNum}`
      }

      const payload = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        description: descriptionLexical,
        slug,
        // Pricing
        price: formData.price,
        salePrice: formData.salePrice || null,
        sku: finalSku,
        // Inventory
        trackQuantity: formData.trackQuantity,
        showStockInFrontend: formData.trackQuantity ? formData.showStockInFrontend : true,
        quantity: formData.trackQuantity ? formData.quantity : null,
        lowStockThreshold: formData.trackQuantity ? formData.lowStockThreshold : null,
        stockStatus: formData.trackQuantity ? undefined : formData.stockStatus,
        allowBackorders: formData.trackQuantity ? formData.allowBackorders : false,
        // Variants
        hasVariants: formData.hasVariants,
        variantOptions: formData.hasVariants ? formData.variantOptions : [],
        // Images
        images: images.map((img) => img.id),
        // Categories
        categories: selectedCategories,
        // Stores - link product to storefront(s)
        stores: storesArray.length > 0 ? storesArray : undefined,
        // Publishing
        _status: statusToUse,
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'خطا در ذخیره محصول')
      }

      const result = await res.json()

      // Update local state to reflect saved status
      setFormData((prev) => ({ ...prev, _status: statusToUse }))

      const successMessage =
        statusToUse === 'published'
          ? product
            ? 'محصول منتشر شد'
            : 'محصول ایجاد و منتشر شد'
          : product
            ? 'محصول ذخیره شد'
            : 'محصول به عنوان پیش‌نویس ذخیره شد'
      toast.success(successMessage)

      // If creating a new product, redirect to edit page so user can see generated variants
      // If editing, stay on the same page and just refresh to show updated data
      if (!product && result.doc?.id) {
        router.push(`/dashboard/products/${result.doc.id}?tab=variants`)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره محصول')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'اطلاعات پایه', icon: <Package className="w-4 h-4" /> },
    { id: 'pricing', label: 'قیمت', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'inventory', label: 'موجودی', icon: <Layers className="w-4 h-4" /> },
    { id: 'variants', label: 'تنوع', icon: <Settings className="w-4 h-4" /> },
  ]

  const stockStatusOptions = [
    { value: 'in_stock', label: 'موجود' },
    { value: 'out_of_stock', label: 'ناموجود' },
    { value: 'low_stock', label: 'کم' },
    { value: 'on_backorder', label: 'پیش‌سفارش' },
    { value: 'discontinued', label: 'توقف تولید' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Basic Info Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="card bg-base-200">
            <div className="card-body space-y-4">
              <h3 className="card-title text-lg">اطلاعات پایه</h3>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">نام محصول *</legend>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="نام محصول شما"
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">توضیح کوتاه</legend>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  placeholder="توضیح کوتاه برای نمایش در لیست محصولات"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">توضیحات کامل</legend>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                  placeholder="توضیحات کامل محصول..."
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">آدرس URL (Slug)</legend>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="product-name"
                  dir="ltr"
                />
                <p className="text-xs text-base-content/60 mt-1">
                  خالی بگذارید تا خودکار از نام محصول ساخته شود
                </p>
              </fieldset>
            </div>
          </div>

          {/* Images */}
          <div className="card bg-base-200">
            <div className="card-body space-y-4">
              <MultiMediaSelector
                value={images}
                onChange={setImages}
                label="تصاویر محصول"
                description="تصویر آپلود کنید یا از آرشیو عکس انتخاب کنید. اولین تصویر، تصویر اصلی محصول خواهد بود. برای تغییر ترتیب، بکشید."
                maxItems={10}
                allowUpload={true}
                allowLibrarySelection={true}
                allowReorder={true}
              />
            </div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="card bg-base-200">
              <div className="card-body space-y-4">
                <h3 className="card-title text-lg">دسته‌بندی</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`btn btn-sm ${
                        selectedCategories.includes(category.id)
                          ? 'btn-primary'
                          : 'btn-ghost bg-base-300'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="card bg-base-200">
          <div className="card-body space-y-4">
            <h3 className="card-title text-lg">قیمت‌گذاری</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">قیمت *</legend>
                <div className="input-group">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min={0}
                    required
                  />
                  <span className="bg-base-300 px-4 flex items-center">؋</span>
                </div>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">قیمت با تخفیف</legend>
                <div className="input-group">
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice || ''}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min={0}
                  />
                  <span className="bg-base-300 px-4 flex items-center">؋</span>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  قیمت اصلی خط‌خورده نمایش داده می‌شود
                </p>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">شناسه محصول (SKU)</legend>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className="input input-bordered flex-1"
                    dir="ltr"
                    placeholder="PROD-001"
                  />
                  <button
                    type="button"
                    onClick={generateSku}
                    className="btn btn-ghost gap-1"
                    title="ایجاد خودکار شناسه"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">ایجاد</span>
                  </button>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="card bg-base-200">
          <div className="card-body space-y-4">
            <h3 className="card-title text-lg">مدیریت موجودی</h3>

            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                name="trackQuantity"
                checked={formData.trackQuantity}
                onChange={handleChange}
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
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min={0}
                  />
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">آستانه هشدار کم بودن</legend>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    min={0}
                  />
                  <p className="text-xs text-base-content/60 mt-1">
                    هشدار «موجودی کم» وقتی تعداد به این مقدار برسد
                  </p>
                </fieldset>

                <div className="md:col-span-2">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      name="allowBackorders"
                      checked={formData.allowBackorders}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <div>
                      <span className="label-text font-medium">قبول پیش‌سفارش</span>
                      <p className="text-xs text-base-content/60">
                        اجازه سفارش وقتی موجودی صفر است
                      </p>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      name="showStockInFrontend"
                      checked={formData.showStockInFrontend}
                      onChange={handleChange}
                      className="checkbox checkbox-primary"
                    />
                    <div>
                      <span className="label-text font-medium">نمایش موجودی به مشتری</span>
                      <p className="text-xs text-base-content/60">
                        وضعیت موجودی در صفحه محصول نمایش داده شود
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <fieldset className="fieldset pt-4">
                <legend className="fieldset-legend">وضعیت موجودی</legend>
                <select
                  name="stockStatus"
                  value={formData.stockStatus}
                  onChange={handleChange}
                  className="select select-bordered w-full max-w-xs"
                >
                  {stockStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}
          </div>
        </div>
      )}

      {/* Variants Tab */}
      {activeTab === 'variants' && (
        <div className="card bg-base-200">
          <div className="card-body space-y-4">
            <h3 className="card-title text-lg">تنوع محصول</h3>

            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                name="hasVariants"
                checked={formData.hasVariants}
                onChange={handleChange}
                className="toggle toggle-primary"
              />
              <div>
                <span className="label-text font-medium">این محصول تنوع دارد</span>
                <p className="text-xs text-base-content/60">مثل سایز، رنگ یا مدل مختلف</p>
              </div>
            </label>

            {formData.hasVariants && (
              <div className="space-y-6 pt-4">
                <div className="alert alert-info">
                  <span>گزینه‌ها را تعریف کنید. تنوع‌ها خودکار بعد از ذخیره ایجاد می‌شوند.</span>
                </div>

                {formData.variantOptions.map((option, optionIndex) => (
                  <div key={optionIndex} className="card bg-base-300">
                    <div className="card-body space-y-4">
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-base-content/40" />
                        <fieldset className="fieldset flex-1">
                          <legend className="fieldset-legend">نام گزینه</legend>
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => updateVariantOptionName(optionIndex, e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="مثلا: سایز، رنگ"
                          />
                        </fieldset>
                        <button
                          type="button"
                          onClick={() => removeVariantOption(optionIndex)}
                          className="btn btn-ghost btn-sm btn-square text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">مقادیر:</p>
                        {option.values.map((val, valueIndex) => (
                          <div key={valueIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={val.value}
                              onChange={(e) =>
                                updateVariantValue(optionIndex, valueIndex, e.target.value)
                              }
                              className="input input-bordered input-sm flex-1"
                              placeholder="مثلا: کوچک، قرمز"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantValue(optionIndex, valueIndex)}
                              className="btn btn-ghost btn-xs btn-square text-error"
                              disabled={option.values.length <= 1}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addVariantValue(optionIndex)}
                          className="btn btn-ghost btn-sm gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          افزودن مقدار
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addVariantOption}
                  className="btn btn-outline btn-primary gap-2"
                >
                  <Plus className="w-5 h-5" />
                  افزودن گزینه جدید
                </button>

                {/* Variant Manager - only show for existing products with variants */}
                {product?.id && formData.variantOptions.length > 0 && (
                  <div className="mt-8">
                    <div className="divider">مدیریت تنوع‌ها</div>
                    <VariantManager
                      productId={product.id}
                      productPrice={formData.price}
                      productSalePrice={formData.salePrice}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-base-200 rounded-lg sticky bottom-0">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          {formData._status === 'published' ? (
            <span className="badge badge-success gap-1">
              <span className="w-2 h-2 rounded-full bg-current"></span>
              منتشر شده
            </span>
          ) : (
            <span className="badge badge-warning gap-1">
              <span className="w-2 h-2 rounded-full bg-current"></span>
              پیش‌نویس
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/products')}
            className="btn btn-ghost btn-sm sm:btn-md"
          >
            انصراف
          </button>
          {/* Save as Draft button */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={isLoading}
            className="btn btn-outline btn-sm sm:btn-md gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">ذخیره پیش‌نویس</span>
            <span className="sm:hidden">ذخیره</span>
          </button>
          {/* Publish button */}
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={isLoading}
            className="btn btn-primary btn-sm sm:btn-md gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            <span>انتشار</span>
          </button>
        </div>
      </div>
    </form>
  )
}
