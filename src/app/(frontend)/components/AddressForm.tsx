'use client'

import React, { useState } from 'react'
import { MapPin, User, Check, X, AlertTriangle, Phone, Tag, Navigation } from 'lucide-react'
import { LocationPicker, type LocationData } from './LocationPicker'
import type { User as UserType } from '@/payload-types'

type Address = NonNullable<UserType['addresses']>[number]

interface AddressFormProps {
  initialData?: Partial<Address>
  onSave: (data: Partial<Address>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialData,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<Partial<Address>>({
    label: initialData?.label || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    state: 'کابل',
    country: 'افغانستان',
    phone: initialData?.phone || '',
    isDefault: initialData?.isDefault || false,
    nearbyLandmark: initialData?.nearbyLandmark || '',
    detailedDirections: initialData?.detailedDirections || '',
    coordinates: initialData?.coordinates,
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.label?.trim()) {
      newErrors.label = 'برچسب آدرس الزامی است'
    }

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'نام الزامی است'
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'تخلص الزامی است'
    }

    if (formData.phone && !/^[+\d\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'فرمت شماره تماس نامعتبر است'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* GPS Location Warning */}
      {!formData.coordinates?.latitude && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <div className="font-semibold text-sm">موقعیت GPS تنظیم نشده است</div>
            <div className="text-xs text-base-content/70 mt-0.5">
              برای تحویل دقیق‌تر، لطفاً موقعیت GPS خود را در بخش زیر تنظیم کنید
            </div>
          </div>
        </div>
      )}

      {/* Basic Info Section */}
      <div className="bg-base-100 rounded-xl p-5 border border-base-300">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          اطلاعات گیرنده
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Label */}
          <div className="fieldset">
            <label className="label">
              <span className="label-text font-medium">
                برچسب آدرس <span className="text-error">*</span>
              </span>
            </label>
            <label
              className={`input w-full flex items-center gap-2 ${errors.label ? 'input-error' : ''}`}
            >
              <Tag className={`w-4 h-4 opacity-50 ${errors.label ? 'text-error' : ''}`} />
              <input
                type="text"
                className="grow"
                placeholder="مثلاً خانه، دفتر کار"
                value={formData.label}
                onChange={(e) => {
                  setFormData({ ...formData, label: e.target.value })
                  if (errors.label) setErrors({ ...errors, label: '' })
                }}
              />
            </label>
            {errors.label ? (
              <label className="label">
                <span className="label-text-alt text-error">{errors.label}</span>
              </label>
            ) : (
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  این برچسب به شما کمک می‌کند آدرس‌ها را سریع‌تر پیدا کنید
                </span>
              </label>
            )}
          </div>

          {/* Phone */}
          <div className="fieldset">
            <label className="label">
              <span className="label-text font-medium">
                شماره تماس <span className="text-error">*</span>
              </span>
            </label>
            <label
              className={`input w-full flex items-center gap-2 ${errors.phone ? 'input-error' : ''}`}
              dir="ltr"
            >
              <Phone className={`w-4 h-4 opacity-50 ${errors.phone ? 'text-error' : ''}`} />
              <input
                type="tel"
                className="grow"
                placeholder="0712345678"
                autoComplete="tel"
                value={formData.phone || ''}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value })
                  if (errors.phone) setErrors({ ...errors, phone: '' })
                }}
                style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
              />
            </label>
            {errors.phone && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.phone}</span>
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="fieldset">
            <label className="label">
              <span className="label-text font-medium">
                نام <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className={`input w-full ${errors.firstName ? 'input-error' : ''}`}
              placeholder="احمد"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value })
                if (errors.firstName) setErrors({ ...errors, firstName: '' })
              }}
            />
            {errors.firstName && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.firstName}</span>
              </label>
            )}
          </div>

          {/* Last Name */}
          <div className="fieldset">
            <label className="label">
              <span className="label-text font-medium">
                تخلص <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className={`input w-full ${errors.lastName ? 'input-error' : ''}`}
              placeholder="احمدی"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value })
                if (errors.lastName) setErrors({ ...errors, lastName: '' })
              }}
            />
            {errors.lastName && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.lastName}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-base-100 rounded-xl p-5 border border-base-300">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            آدرس تحویل
          </h4>
          {formData.coordinates?.latitude && (
            <span className="badge badge-success badge-sm gap-1">
              <Check className="w-3 h-3" />
              GPS تنظیم شد
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Province & Country (locked) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="fieldset">
              <label className="label">
                <span className="label-text font-medium">ولایت</span>
              </label>
              <input
                type="text"
                className="input w-full bg-base-200"
                value="کابل"
                disabled
                readOnly
              />
            </div>
            <div className="fieldset">
              <label className="label">
                <span className="label-text font-medium">کشور</span>
              </label>
              <input
                type="text"
                className="input w-full bg-base-200"
                value="افغانستان"
                disabled
                readOnly
              />
            </div>
          </div>

          {/* Nearby Landmark */}
          <div className="fieldset">
            <label className="label">
              <span className="label-text font-medium">
                نشانی نزدیک <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="مثلاً چهارراهی شهید، نزدیک مسجد جامع"
              value={formData.nearbyLandmark || ''}
              onChange={(e) => setFormData({ ...formData, nearbyLandmark: e.target.value })}
              required
            />
          </div>

          {/* Detailed Directions */}
          <div className="fieldset">
            <label className="label">
              <span className="label-text font-medium">
                توضیحات مسیر <span className="text-error">*</span>
              </span>
            </label>
            <textarea
              className="textarea w-full h-20"
              placeholder="مسیر دقیق را بیان کنید، مثلاً از چهارراهی شهید به طرف لیسه زرغونه بروید، بعد از 50 متر کوچه سمت راست، خانه شماره 306"
              value={formData.detailedDirections || ''}
              onChange={(e) => setFormData({ ...formData, detailedDirections: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* GPS Location Section */}
      <div className="bg-base-100 rounded-xl p-5 border border-base-300">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          موقعیت GPS
        </h4>
        <LocationPicker
          latitude={formData.coordinates?.latitude ?? undefined}
          longitude={formData.coordinates?.longitude ?? undefined}
          onLocationSelect={(locationData: LocationData) =>
            setFormData({
              ...formData,
              coordinates: {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy,
                source: locationData.source,
                ip: locationData.ip,
              },
            })
          }
        />
      </div>

      {/* Default Address Toggle */}
      <label className="cursor-pointer flex items-center gap-4 bg-base-100 rounded-xl p-4 border border-base-300 hover:border-primary/30 transition-colors">
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          checked={formData.isDefault || false}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
        />
        <div className="flex-1">
          <div className="font-medium">تنظیم به عنوان آدرس اصلی</div>
          <p className="text-xs text-base-content/60 mt-0.5">
            این آدرس به طور خودکار در هنگام خرید انتخاب می‌شود
          </p>
        </div>
      </label>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-base-300">
        <button type="submit" className="btn btn-primary flex-1 gap-2" disabled={saving}>
          {saving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              در حال ذخیره...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {isEdit ? 'ذخیره تغییرات' : 'ذخیره آدرس'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline btn-error gap-2"
          disabled={saving}
        >
          <X className="w-4 h-4" />
          لغو
        </button>
      </div>
    </form>
  )
}
