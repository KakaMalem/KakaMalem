'use client'

import React, { useState, useCallback } from 'react'
import {
  MapPin,
  Plus,
  Check,
  User,
  LogIn,
  UserPlus,
  Mail,
  Phone,
  Navigation,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { User as UserType } from '@/payload-types'
import { LocationPicker, type LocationData } from '../LocationPicker'
import { AddressForm } from '../AddressForm'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Constants for location defaults
const DEFAULT_STATE = 'کابل'
const DEFAULT_COUNTRY = 'افغانستان'

export interface GuestFormData {
  email: string
  firstName: string
  lastName: string
  state: string
  country: string
  phone: string
  nearbyLandmark: string
  detailedDirections: string
  coordinates: {
    latitude: number | null
    longitude: number | null
    accuracy?: number | null
    source?: 'gps' | 'ip' | 'manual' | 'map' | null
    ip?: string | null
  }
}

type GuestFormErrors = Partial<Record<keyof GuestFormData, string>>

interface ShippingStepProps {
  user: UserType | null
  selectedAddressIndex: number | null
  setSelectedAddressIndex: (index: number | null) => void
  guestForm: GuestFormData
  setGuestForm: (form: GuestFormData) => void
  onValidationChange?: (isValid: boolean) => void
}

export function ShippingStep({
  user,
  selectedAddressIndex,
  setSelectedAddressIndex,
  guestForm,
  setGuestForm,
  onValidationChange: _onValidationChange,
}: ShippingStepProps) {
  const router = useRouter()
  const userAddresses = user?.addresses || []
  const [showAddressForm, setShowAddressForm] = useState(userAddresses.length === 0)
  const [errors, setErrors] = useState<GuestFormErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  // Validate a single field
  const validateField = useCallback((field: keyof GuestFormData, value: string): string => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'ایمیل الزامی است'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'فرمت ایمیل نامعتبر است'
        return ''
      case 'firstName':
        if (!value.trim()) return 'نام الزامی است'
        return ''
      case 'lastName':
        if (!value.trim()) return 'تخلص الزامی است'
        return ''
      case 'phone':
        if (!value.trim()) return 'شماره تماس الزامی است'
        if (!/^[+\d\s()-]+$/.test(value)) return 'فرمت شماره تماس نامعتبر است'
        return ''
      // nearbyLandmark and detailedDirections are now optional
      default:
        return ''
    }
  }, [])

  // Handle field blur for validation
  const handleBlur = (field: keyof GuestFormData) => {
    setTouched((prev) => new Set(prev).add(field))
    const value = guestForm[field]
    if (typeof value === 'string') {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  // Handle field change with live validation for touched fields
  const handleFieldChange = (field: keyof GuestFormData, value: string) => {
    setGuestForm({ ...guestForm, [field]: value })
    if (touched.has(field)) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const handleSaveAddress = async (
    addressData: Partial<NonNullable<UserType['addresses']>[number]>,
  ) => {
    if (!user?.id) {
      toast.error('خطا: کاربر یافت نشد')
      throw new Error('User not found')
    }

    try {
      const newAddress = {
        ...addressData,
        id: `addr_${Date.now()}`,
      }

      // If this address is set as default, unset other defaults
      let updatedAddresses = [...userAddresses, newAddress]
      if (addressData.isDefault) {
        updatedAddresses = updatedAddresses.map((addr) =>
          addr.id === newAddress.id ? addr : { ...addr, isDefault: false },
        )
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          addresses: updatedAddresses,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save address')
      }

      toast.success('آدرس با موفقیت ذخیره شد!')
      setShowAddressForm(false)
      // Refresh the page to get updated user data
      router.refresh()
    } catch (error) {
      console.error('Error saving address:', error)
      const errorMessage = error instanceof Error ? error.message : 'خطا در ذخیره آدرس'
      toast.error(errorMessage)
      throw error
    }
  }

  // Helper to render field error
  const renderFieldError = (field: keyof GuestFormData) => {
    const error = errors[field]
    if (!error || !touched.has(field)) return null
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-error text-sm">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  // Get input class based on error state
  const getInputClass = (field: keyof GuestFormData, baseClass: string = 'input w-full') => {
    const hasError = errors[field] && touched.has(field)
    return `${baseClass} ${hasError ? 'input-error' : ''} focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          آدرس تحویل گیرنده
        </h2>

        {user ? (
          // Authenticated user - show saved addresses or address form
          <>
            {userAddresses.length > 0 && !showAddressForm ? (
              <>
                <div className="space-y-3">
                  {userAddresses.map((address, index) => (
                    <div
                      key={address.id || index}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedAddressIndex === index
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-base-300 hover:border-primary/40 hover:bg-base-100'
                      }`}
                      onClick={() => setSelectedAddressIndex(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedAddressIndex(index)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="selected-address"
                          className="radio radio-primary mt-1"
                          checked={selectedAddressIndex === index}
                          onChange={() => setSelectedAddressIndex(index)}
                          aria-label={`انتخاب ${address.label}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold flex items-center gap-2 flex-wrap">
                            <span>{address.label}</span>
                            {address.isDefault && (
                              <span className="badge badge-primary badge-sm">آدرس اصلی</span>
                            )}
                          </div>
                          <div className="text-sm mt-1.5 text-base-content/80">
                            {address.firstName} {address.lastName}
                          </div>
                          <div className="text-sm text-base-content/60 mt-1">
                            {address.state}، {address.country}
                          </div>
                          {address.phone && (
                            <div className="text-sm text-base-content/60 mt-1">
                              شماره تماس: <span dir="ltr">{address.phone}</span>
                            </div>
                          )}
                          {address.nearbyLandmark && (
                            <div className="text-sm text-base-content/60 flex items-center gap-1.5 mt-2">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{address.nearbyLandmark}</span>
                            </div>
                          )}
                          {address.coordinates?.latitude && address.coordinates?.longitude && (
                            <div className="text-xs text-success mt-2 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              موقعیت GPS ثبت شده
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddressForm(true)}
                  className="btn btn-outline btn-primary btn-sm mt-4 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  افزودن آدرس جدید
                </button>
              </>
            ) : (
              <>
                <div className="alert alert-info mb-6">
                  <span>
                    لطفاً آدرس تحویل خود را وارد کنید. این آدرس برای سفارش‌های آینده شما ذخیره خواهد
                    شد.
                  </span>
                </div>

                <AddressForm
                  onSave={handleSaveAddress}
                  onCancel={() => {
                    if (userAddresses.length > 0) {
                      setShowAddressForm(false)
                    } else {
                      toast.error('برای ادامه باید حداقل یک آدرس اضافه کنید')
                    }
                  }}
                  isEdit={false}
                />
              </>
            )}
          </>
        ) : (
          // Guest user - show login prompt and checkout form
          <div className="space-y-6">
            {/* Login/Register Prompt */}
            <div className="bg-base-100 rounded-2xl p-5 border border-base-300 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">حساب کاربری دارید؟</h3>
                  <p className="text-sm text-base-content/70 mb-4">
                    با ورود به حساب کاربری، آدرس‌های ذخیره شده و پیگیری سفارشات را خواهید داشت.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/auth/login?redirect=/checkout"
                      className="btn btn-primary btn-sm gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      ورود به حساب
                    </Link>
                    <Link
                      href="/auth/register?redirect=/checkout"
                      className="btn btn-outline btn-sm gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      ایجاد حساب جدید
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider text-sm text-base-content/60 font-medium">
              یا ادامه به عنوان مهمان
            </div>

            {/* Guest Form */}
            <div className="space-y-5">
              {/* Contact Information */}
              <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                  </div>
                  اطلاعات تماس
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="fieldset">
                    <label className="label" htmlFor="guest-firstName">
                      <span className="label-text font-medium">
                        نام <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="guest-firstName"
                      type="text"
                      placeholder="احمد"
                      autoComplete="given-name"
                      className={getInputClass('firstName')}
                      value={guestForm.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                    />
                    {renderFieldError('firstName')}
                  </div>

                  <div className="fieldset">
                    <label className="label" htmlFor="guest-lastName">
                      <span className="label-text font-medium">
                        تخلص <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="guest-lastName"
                      type="text"
                      placeholder="احمدی"
                      autoComplete="family-name"
                      className={getInputClass('lastName')}
                      value={guestForm.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                    />
                    {renderFieldError('lastName')}
                  </div>

                  <div className="fieldset">
                    <label className="label" htmlFor="guest-email">
                      <span className="label-text font-medium">
                        ایمیل <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      placeholder="your@email.com"
                      autoComplete="email"
                      className={getInputClass('email')}
                      value={guestForm.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                    />
                    {renderFieldError('email')}
                  </div>

                  <div className="fieldset">
                    <label className="label" htmlFor="guest-phone">
                      <span className="label-text font-medium">
                        شماره تماس <span className="text-error">*</span>
                      </span>
                    </label>
                    <label
                      className={`input w-full flex items-center gap-2 ${errors.phone && touched.has('phone') ? 'input-error' : ''} focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all`}
                      dir="ltr"
                    >
                      <Phone
                        className={`w-4 h-4 flex-shrink-0 ${errors.phone && touched.has('phone') ? 'text-error' : 'opacity-50'}`}
                      />
                      <input
                        id="guest-phone"
                        type="tel"
                        placeholder="0712345678"
                        autoComplete="tel"
                        className="grow bg-transparent focus:outline-none"
                        value={guestForm.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                      />
                    </label>
                    {renderFieldError('phone')}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                  </div>
                  آدرس تحویل
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="fieldset">
                      <label className="label">
                        <span className="label-text font-medium">ولایت</span>
                      </label>
                      <input
                        type="text"
                        className="input w-full bg-base-200 cursor-not-allowed opacity-70"
                        value={DEFAULT_STATE}
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
                        className="input w-full bg-base-200 cursor-not-allowed opacity-70"
                        value={DEFAULT_COUNTRY}
                        disabled
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="fieldset">
                    <label className="label" htmlFor="guest-nearbyLandmark">
                      <span className="label-text font-medium">
                        نشانی نزدیک <span className="text-base-content/50 text-xs">(اختیاری)</span>
                      </span>
                    </label>
                    <input
                      id="guest-nearbyLandmark"
                      type="text"
                      placeholder="مثلاً چهارراهی شهید، نزدیک مسجد جامع"
                      className={getInputClass('nearbyLandmark')}
                      value={guestForm.nearbyLandmark}
                      onChange={(e) => handleFieldChange('nearbyLandmark', e.target.value)}
                      onBlur={() => handleBlur('nearbyLandmark')}
                    />
                    {renderFieldError('nearbyLandmark')}
                  </div>

                  <div className="fieldset">
                    <label className="label" htmlFor="guest-detailedDirections">
                      <span className="label-text font-medium">
                        توضیحات مسیر <span className="text-base-content/50 text-xs">(اختیاری)</span>
                      </span>
                    </label>
                    <textarea
                      id="guest-detailedDirections"
                      placeholder="مسیر دقیق را بیان کنید، مثلاً از چهارراهی شهید به طرف لیسه زرغونه بروید، بعد از 50 متر کوچه سمت راست، خانه شماره 306"
                      className={`textarea w-full h-24 ${errors.detailedDirections && touched.has('detailedDirections') ? 'textarea-error' : ''} focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all`}
                      value={guestForm.detailedDirections}
                      onChange={(e) => handleFieldChange('detailedDirections', e.target.value)}
                      onBlur={() => handleBlur('detailedDirections')}
                    />
                    {renderFieldError('detailedDirections')}
                  </div>
                </div>
              </div>

              {/* GPS Location - Required */}
              <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Navigation className="w-3.5 h-3.5 text-primary" />
                    </div>
                    موقعیت تحویل <span className="text-error">*</span>
                  </h3>
                  {guestForm.coordinates.latitude && guestForm.coordinates.longitude && (
                    <span
                      className={`badge badge-sm gap-1 ${guestForm.coordinates.source === 'ip' ? 'badge-warning' : 'badge-success'}`}
                    >
                      <Check className="w-3 h-3" />
                      {guestForm.coordinates.source === 'ip' ? 'تقریبی' : 'ثبت شده'}
                    </span>
                  )}
                </div>
                <LocationPicker
                  onLocationSelect={(locationData: LocationData) => {
                    setGuestForm({
                      ...guestForm,
                      coordinates: {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                        accuracy: locationData.accuracy,
                        source: locationData.source,
                        ip: locationData.ip,
                      },
                    })
                  }}
                  latitude={guestForm.coordinates.latitude ?? undefined}
                  longitude={guestForm.coordinates.longitude ?? undefined}
                  required={true}
                  autoDetect={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
