'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Store, Palette, Globe, Save, Loader2 } from 'lucide-react'
import type { Storefront } from '@/payload-types'
import { MediaSelector } from '@/app/(frontend)/components/MediaSelector'

interface StorefrontFormProps {
  storefront: Storefront | null
}

export default function StorefrontForm({ storefront }: StorefrontFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'branding' | 'social'>('basic')

  // Helper to get media URL from storefront data
  const getMediaUrl = (media: Storefront['logo']): string | null => {
    if (!media) return null
    if (typeof media === 'object' && media !== null && 'url' in media) {
      return media.url as string
    }
    return null
  }

  // Helper to get media ID from storefront data
  const getMediaId = (media: Storefront['logo']): string | null => {
    if (!media) return null
    if (typeof media === 'string') return media
    if (typeof media === 'object' && media !== null && 'id' in media) {
      return media.id as string
    }
    return null
  }

  // Form state
  const [formData, setFormData] = useState({
    name: storefront?.name || '',
    tagline: storefront?.tagline || '',
    description: storefront?.description || '',
    contactEmail: storefront?.contactEmail || '',
    contactPhone: storefront?.contactPhone || '',
    // Branding - Logo
    logo: getMediaId(storefront?.logo) || (null as string | null),
    logoUrl: getMediaUrl(storefront?.logo) || (null as string | null),
    // Header display
    headerDisplay: storefront?.headerDisplay || 'logo_and_name',
    // Social
    facebook: storefront?.socialLinks?.facebook || '',
    instagram: storefront?.socialLinks?.instagram || '',
    twitter: storefront?.socialLinks?.twitter || '',
    whatsapp: storefront?.socialLinks?.whatsapp || '',
    telegram: storefront?.socialLinks?.telegram || '',
    tiktok: storefront?.socialLinks?.tiktok || '',
    // SEO
    metaTitle: storefront?.seo?.metaTitle || '',
    metaDescription: storefront?.seo?.metaDescription || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const endpoint = storefront ? `/api/storefronts/${storefront.id}` : '/api/storefronts'
      const method = storefront ? 'PATCH' : 'POST'

      const payload = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        // Branding
        logo: formData.logo || null,
        headerDisplay: formData.headerDisplay,
        socialLinks: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          twitter: formData.twitter,
          whatsapp: formData.whatsapp,
          telegram: formData.telegram,
          tiktok: formData.tiktok,
        },
        seo: {
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
        },
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
        throw new Error(data.errors?.[0]?.message || 'خطا در ذخیره اطلاعات')
      }

      toast.success(storefront ? 'فروشگاه با موفقیت ویرایش شد' : 'فروشگاه با موفقیت ایجاد شد')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره اطلاعات')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'اطلاعات پایه', icon: <Store className="w-4 h-4" /> },
    { id: 'branding', label: 'برندینگ', icon: <Palette className="w-4 h-4" /> },
    { id: 'social', label: 'شبکه‌های اجتماعی', icon: <Globe className="w-4 h-4" /> },
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
        <div className="card bg-base-200">
          <div className="card-body space-y-4">
            <h3 className="card-title text-lg">اطلاعات پایه فروشگاه</h3>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">نام فروشگاه *</legend>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="نام فروشگاه شما"
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">شعار فروشگاه</legend>
              <input
                type="text"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="یک جمله کوتاه و جذاب"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">توضیحات</legend>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="textarea textarea-bordered w-full"
                rows={4}
                placeholder="درباره فروشگاه خود بنویسید..."
              />
            </fieldset>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">ایمیل تماس</legend>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="contact@example.com"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">شماره تماس</legend>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="0700000000"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>
            </div>

            <div className="divider">SEO</div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">عنوان صفحه (Meta Title)</legend>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleChange}
                className="input input-bordered w-full"
                placeholder="عنوان برای موتورهای جستجو"
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">توضیحات صفحه (Meta Description)</legend>
              <textarea
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleChange}
                className="textarea textarea-bordered w-full"
                rows={2}
                placeholder="توضیحات کوتاه برای نمایش در نتایج جستجو"
              />
            </fieldset>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Logo */}
          <div className="card bg-base-200">
            <div className="card-body space-y-6">
              <h3 className="card-title text-lg">لوگو</h3>

              {/* Logo Upload */}
              <MediaSelector
                value={formData.logo || undefined}
                imageUrl={formData.logoUrl}
                onChange={(mediaId, imageUrl) =>
                  setFormData((prev) => ({
                    ...prev,
                    logo: mediaId,
                    logoUrl: imageUrl,
                  }))
                }
                onRemove={() =>
                  setFormData((prev) => ({
                    ...prev,
                    logo: null,
                    logoUrl: null,
                  }))
                }
                label="Store Logo"
                description="Recommended: 200×200 pixels, transparent PNG"
                shape="square"
                aspectRatio="aspect-square"
                allowUpload={true}
                allowLibrarySelection={true}
              />
            </div>
          </div>

          {/* Header Display */}
          <div className="card bg-base-200">
            <div className="card-body space-y-4">
              <h3 className="card-title text-lg">نمایش هدر</h3>
              <p className="text-sm text-base-content/60">
                انتخاب کنید که در هدر فروشگاه چه چیزی نمایش داده شود.
              </p>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">نمایش در هدر</legend>
                <select
                  name="headerDisplay"
                  value={formData.headerDisplay}
                  onChange={handleChange}
                  className="select select-bordered w-full max-w-xs"
                >
                  <option value="logo_and_name">لوگو و نام</option>
                  <option value="logo_only">فقط لوگو</option>
                  <option value="name_only">فقط نام</option>
                </select>
              </fieldset>
            </div>
          </div>
        </div>
      )}

      {/* Social Tab */}
      {activeTab === 'social' && (
        <div className="card bg-base-200">
          <div className="card-body space-y-4">
            <h3 className="card-title text-lg">شبکه‌های اجتماعی</h3>
            <p className="text-sm text-base-content/60">
              لینک صفحات اجتماعی خود را اضافه کنید تا مشتریان بتوانند شما را دنبال کنند.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">اینستاگرام</legend>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="https://instagram.com/yourpage"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">فیسبوک</legend>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="https://facebook.com/yourpage"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">واتساپ</legend>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="+93700000000"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">تلگرام</legend>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="@yourusername"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">توییتر/X</legend>
                <input
                  type="url"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="https://twitter.com/yourpage"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">تیک‌تاک</legend>
                <input
                  type="url"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="https://tiktok.com/@yourpage"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                />
              </fieldset>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {storefront ? 'ذخیره تغییرات' : 'ایجاد فروشگاه'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
