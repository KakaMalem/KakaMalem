'use client'

import React, { useState } from 'react'
import { MapPin, Plus, Check, User, LogIn, UserPlus, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import type { User as UserType } from '@/payload-types'
import { LocationPicker, type LocationData } from '../LocationPicker'
import { AddressForm } from '../AddressForm'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface GuestFormData {
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

interface ShippingStepProps {
  user: UserType | null
  selectedAddressIndex: number | null
  setSelectedAddressIndex: (index: number | null) => void
  guestForm: GuestFormData
  setGuestForm: (form: GuestFormData) => void
}

export function ShippingStep({
  user,
  selectedAddressIndex,
  setSelectedAddressIndex,
  guestForm,
  setGuestForm,
}: ShippingStepProps) {
  const router = useRouter()
  const userAddresses = user?.addresses || []
  const [showAddressForm, setShowAddressForm] = useState(userAddresses.length === 0)

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

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
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
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAddressIndex === index
                          ? 'border-primary bg-primary/5'
                          : 'border-base-300 hover:border-base-content/20'
                      }`}
                      onClick={() => setSelectedAddressIndex(index)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          className="radio radio-primary mt-1"
                          checked={selectedAddressIndex === index}
                          onChange={() => setSelectedAddressIndex(index)}
                        />
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {address.label}
                            {address.isDefault && (
                              <span className="badge badge-primary badge-sm">آدرس اصلی</span>
                            )}
                          </div>
                          <div className="text-sm mt-1">
                            {address.firstName} {address.lastName}
                          </div>
                          {address.state && (
                            <div className="text-sm opacity-70">{address.state}</div>
                          )}
                          <div className="text-sm opacity-70">{address.country}</div>
                          {address.phone && (
                            <div className="text-sm opacity-70">
                              شماره تماس:
                              <span dir="ltr">{address.phone}</span>
                            </div>
                          )}
                          {address.nearbyLandmark && (
                            <div className="text-sm opacity-70 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{address.nearbyLandmark}</span>
                            </div>
                          )}
                          {address.coordinates?.latitude && address.coordinates?.longitude && (
                            <div className="text-xs text-success mt-1 flex items-center gap-1">
                              <Check className="w-3 h-3" />
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
                  className="btn btn-primary btn-sm mt-4"
                >
                  <Plus className="w-4 h-4" />
                  افزودن آدرس جدید
                </button>
              </>
            ) : (
              <>
                <div className="alert alert-info mb-4">
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
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-5 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">حساب کاربری دارید؟</h3>
                  <p className="text-sm text-base-content/70 mb-4">
                    با ورود به حساب کاربری، آدرس‌های ذخیره شده و پیگیری سفارشات را خواهید داشت.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/auth/login?redirect=/checkout"
                      className="btn btn-primary btn-sm gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      ورود
                    </Link>
                    <Link
                      href="/auth/register?redirect=/checkout"
                      className="btn btn-ghost btn-sm gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      ثبت‌نام
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="divider text-sm text-base-content/50">یا ادامه به عنوان مهمان</div>

            {/* Guest Form */}
            <div className="space-y-5">
              {/* Contact Information */}
              <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  اطلاعات تماس
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">
                        نام <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="احمد"
                      autoComplete="given-name"
                      className="input w-full"
                      value={guestForm.firstName}
                      onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">
                        تخلص <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="احمدی"
                      autoComplete="family-name"
                      className="input w-full"
                      value={guestForm.lastName}
                      onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">
                        ایمیل <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="input w-full"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      required
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                    />
                  </div>

                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">
                        شماره تماس <span className="text-error">*</span>
                      </span>
                    </label>
                    <label className="input w-full flex items-center gap-2" dir="ltr">
                      <Phone className="w-4 h-4 opacity-50" />
                      <input
                        type="tel"
                        placeholder="0712345678"
                        autoComplete="tel"
                        className="grow"
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                        required
                        style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
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

                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">
                        نشانی نزدیک <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثلاً چهارراهی شهید، نزدیک مسجد جامع"
                      className="input w-full"
                      value={guestForm.nearbyLandmark}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, nearbyLandmark: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="fieldset">
                    <label className="label">
                      <span className="label-text font-medium">
                        توضیحات مسیر <span className="text-error">*</span>
                      </span>
                    </label>
                    <textarea
                      placeholder="مسیر دقیق را بیان کنید، مثلاً از چهارراهی شهید به طرف لیسه زرغونه بروید، بعد از 50 متر کوچه سمت راست، خانه شماره 306"
                      className="textarea w-full h-20"
                      value={guestForm.detailedDirections}
                      onChange={(e) =>
                        setGuestForm({ ...guestForm, detailedDirections: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* GPS Location */}
              <div className="bg-base-100 rounded-xl p-5 border border-base-300">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  موقعیت GPS
                </h3>
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
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
