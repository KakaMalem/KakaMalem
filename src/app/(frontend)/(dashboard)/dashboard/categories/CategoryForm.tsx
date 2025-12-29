'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Save, Loader2 } from 'lucide-react'
import type { Category, Media } from '@/payload-types'
import { MediaSelector } from '@/app/(frontend)/components/MediaSelector'

interface CategoryFormProps {
  category: Category | null
  storefrontId: string
}

export default function CategoryForm({ category, storefrontId }: CategoryFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Helper to get media URL
  const getMediaUrl = (media: Category['smallCategoryImage']): string | null => {
    if (!media) return null
    if (typeof media === 'object' && media !== null && 'url' in media) {
      return (media as Media).url || null
    }
    return null
  }

  // Helper to get media ID
  const getMediaId = (media: Category['smallCategoryImage']): string | null => {
    if (!media) return null
    if (typeof media === 'string') return media
    if (typeof media === 'object' && media !== null && 'id' in media) {
      return (media as Media).id
    }
    return null
  }

  // Form state
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    displayOrder: category?.displayOrder || 0,
    showInMenu: category?.showInMenu ?? true,
    // Images
    smallCategoryImage: getMediaId(category?.smallCategoryImage),
    smallCategoryImageUrl: getMediaUrl(category?.smallCategoryImage),
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = category ? `/api/categories/${category.id}` : '/api/categories'
      const method = category ? 'PATCH' : 'POST'

      // Generate slug from name if not provided
      const slug =
        formData.slug ||
        formData.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

      const payload = {
        name: formData.name,
        slug,
        description: formData.description,
        displayOrder: formData.displayOrder,
        showInMenu: formData.showInMenu,
        smallCategoryImage: formData.smallCategoryImage || null,
        stores: [storefrontId], // Link to storefront
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
        throw new Error(data.errors?.[0]?.message || 'خطا در ذخیره دسته‌بندی')
      }

      toast.success(category ? 'دسته‌بندی با موفقیت ویرایش شد' : 'دسته‌بندی با موفقیت ایجاد شد')
      router.push('/dashboard/categories')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره دسته‌بندی')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          <h3 className="card-title text-lg">اطلاعات پایه</h3>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">نام دسته‌بندی *</legend>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input input-bordered w-full"
              placeholder="نام دسته‌بندی"
              required
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
              placeholder="category-name"
              dir="ltr"
            />
            <p className="text-xs text-base-content/60 mt-1">
              خالی بگذارید تا خودکار از نام ساخته شود
            </p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">توضیحات</legend>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder="توضیحات دسته‌بندی..."
            />
          </fieldset>
        </div>
      </div>

      {/* Images */}
      <div className="card bg-base-200">
        <div className="card-body space-y-6">
          <h3 className="card-title text-lg">تصاویر</h3>

          <MediaSelector
            value={formData.smallCategoryImage || undefined}
            imageUrl={formData.smallCategoryImageUrl}
            onChange={(mediaId, imageUrl) =>
              setFormData((prev) => ({
                ...prev,
                smallCategoryImage: mediaId,
                smallCategoryImageUrl: imageUrl,
              }))
            }
            onRemove={() =>
              setFormData((prev) => ({
                ...prev,
                smallCategoryImage: null,
                smallCategoryImageUrl: null,
              }))
            }
            label="Category Image"
            description="Recommended: 200×200 pixels"
            shape="square"
            aspectRatio="aspect-square"
            allowUpload={true}
            allowLibrarySelection={true}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="card bg-base-200">
        <div className="card-body space-y-4">
          <h3 className="card-title text-lg">تنظیمات</h3>

          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              name="showInMenu"
              checked={formData.showInMenu}
              onChange={handleChange}
              className="checkbox checkbox-primary"
            />
            <div>
              <span className="label-text font-medium">نمایش در منو</span>
              <p className="text-xs text-base-content/60">نمایش در منوی ناوبری فروشگاه</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/categories')}
          className="btn btn-ghost"
        >
          انصراف
        </button>
        <button type="submit" disabled={isLoading} className="btn btn-primary gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {category ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
