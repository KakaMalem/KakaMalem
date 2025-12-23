'use client'

import React, { useState } from 'react'
import {
  Bell,
  DollarSign,
  Lock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Settings,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

interface SettingsClientProps {
  user: User
}

export default function SettingsClient({ user: initialUser }: SettingsClientProps) {
  const [user, setUser] = useState(initialUser)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Check if user needs to set a password (OAuth users who haven't set one yet)
  const needsToSetPassword = !!user.sub && !user.hasPassword

  // Preferences state
  const [newsletter, setNewsletter] = useState(user.preferences?.newsletter || false)
  const [currency, setCurrency] = useState<'USD' | 'AFN'>('AFN')

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handleSavePreferences = async () => {
    setSavingPreferences(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          preferences: {
            newsletter,
            currency,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success('ترجیحات با موفقیت ثبت شد!')
    } catch (err: unknown) {
      console.error('Error updating preferences:', err)
      toast.error('ثبت ترجیحات ناموفق بود. لطفاً دوباره امتحان کنید.')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    // Validation - Users setting password for first time don't need current password
    if (needsToSetPassword) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('Please enter and confirm your new password')
        return
      }
    } else {
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        setPasswordError('All fields are required')
        return
      }
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setSavingPassword(true)
    try {
      const response = await fetch('/api/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword || undefined,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password')
      }

      toast.success(data.message || 'رمز عبور با موفقیت ثبت شد!')

      // Update user state to reflect that they now have a password
      setUser({ ...user, hasPassword: true })

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err: unknown) {
      console.error('Error setting password:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to set password. Please try again.'
      setPasswordError(errorMessage)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      // Redirect to home after deletion
      toast.success('حساب کاربری با موفقیت حذف شد')
      window.location.href = '/'
    } catch (err: unknown) {
      console.error('Error deleting account:', err)
      toast.error('حذف حساب کاربری ناموفق بود. لطفاً دوباره امتحان کنید.')
    } finally {
      setDeletingAccount(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'حساب کاربری', href: '/account' },
          { label: 'تنظیمات', active: true },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl md:text-3xl font-bold">تنظیمات حساب کاربری</h2>
          <p className="text-sm md:text-base text-base-content/70 mt-0.5">
            مدیریت ترجیحات و امنیت حساب کاربری
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="card bg-base-100 border-2 border-base-300">
        <div className="card-body p-4 md:p-8">
          <div className="flex items-center gap-2 pb-3 border-b border-base-300 mb-4 md:mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">ترجیحات</h3>
          </div>

          <div className="space-y-6">
            {/* Newsletter Toggle */}
            <div>
              <label className="flex items-start cursor-pointer gap-3 bg-base-200 hover:bg-base-300/50 transition-colors rounded-lg p-3 md:p-4 border-2 border-base-300">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary flex-shrink-0 mt-0.5"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">اشتراک خبرنامه</span>
                    {newsletter && <span className="badge badge-primary badge-sm">فعال</span>}
                  </div>
                  <p className="text-xs md:text-sm text-base-content/60 mt-1 break-words">
                    دریافت ثبت‌ها درباره محصولات جدید، پیشنهادات ویژه، و تخفیف‌های انحصاری
                  </p>
                </div>
              </label>
            </div>

            <div className="divider my-4"></div>

            {/* Currency Selection */}
            <div>
              <label className="label pb-2">
                <span className="label-text font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  واحد پول ترجیحی
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`label cursor-pointer justify-start gap-3 rounded-lg p-3 md:p-4 border-2 transition-all ${
                    currency === 'AFN'
                      ? 'border-primary bg-primary/5'
                      : 'border-base-300 hover:border-primary/50 bg-base-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value="AFN"
                    className="radio radio-primary flex-shrink-0"
                    checked={currency === 'AFN'}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'AFN')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">افغانی</div>
                    <div className="text-xs text-base-content/60">AFN - ؋</div>
                  </div>
                  {currency === 'AFN' && (
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </label>

                <label
                  className={`label cursor-not-allowed justify-start gap-3 rounded-lg p-3 md:p-4 border-2 transition-all opacity-50 border-base-300 bg-base-200`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value="USD"
                    className="radio radio-primary flex-shrink-0"
                    checked={currency === 'USD'}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'AFN')}
                    disabled
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">دلار امریکا</div>
                    <div className="text-xs text-base-content/60">USD - $ (به زودی)</div>
                  </div>
                  {currency === 'USD' && (
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </label>
              </div>
              <label className="label pt-2">
                <span className="label-text-alt text-base-content/60">
                  این واحد برای نمایش قیمت‌ها در سراسر سایت استفاده می‌شود
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="card-actions pt-2">
              <button
                onClick={handleSavePreferences}
                className="btn btn-primary gap-2"
                disabled={savingPreferences}
              >
                {savingPreferences ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    ذخیره ترجیحات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card bg-base-100 border-2 border-base-300">
        <div className="card-body p-4 md:p-8">
          <div className="flex items-center gap-2 pb-3 border-b border-base-300 mb-4 md:mb-6">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">امنیت</h3>
          </div>

          {!showPasswordForm ? (
            <div>
              {needsToSetPassword ? (
                <div className="space-y-4">
                  <div className="alert alert-success">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">شما با گوگل وارد شده‌اید</div>
                      <p className="text-xs md:text-sm opacity-90 mt-1">
                        یک رمز عبور ایجاد کنید تا بتوانید با گوگل و ایمیل/رمز عبور وارد شوید
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn btn-primary gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    تنظیم رمز عبور
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-base-200 rounded-lg p-3 md:p-4 border-2 border-base-300">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium mb-1">رمز عبور حساب کاربری</div>
                        <p className="text-xs md:text-sm text-base-content/60">
                          با استفاده از یک رمز عبور قوی و منحصر به فرد، حساب خود را امن نگه دارید
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn btn-primary gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    تغییر رمز عبور
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {passwordError && (
                <div className="alert alert-error">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{passwordError}</span>
                </div>
              )}

              {needsToSetPassword && (
                <div className="alert alert-info">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs md:text-sm">
                    تنظیم رمز عبور به شما اجازه می‌دهد با گوگل یا ایمیل/رمز عبور وارد شوید.
                  </span>
                </div>
              )}

              {/* Current Password - Only show if user already has a password */}
              {!needsToSetPassword && (
                <div className="fieldset">
                  <label className="label pb-1">
                    <span className="label-text font-medium">رمز عبور فعلی</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      className="input w-full pl-12"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                      }
                      className="btn btn-ghost btn-sm absolute left-1 top-1"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="fieldset">
                <label className="label pb-1">
                  <span className="label-text font-medium">
                    {needsToSetPassword ? 'رمز عبور' : 'رمز عبور جدید'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    className="input w-full pl-12"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="btn btn-ghost btn-sm absolute left-1 top-1"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <label className="label pt-1">
                  <span className="label-text-alt text-base-content/60">حداقل 8 حرف</span>
                </label>
              </div>

              {/* Confirm Password */}
              <div className="fieldset">
                <label className="label pb-1">
                  <span className="label-text font-medium">
                    {needsToSetPassword ? 'تأیید رمز عبور' : 'تأیید رمز عبور جدید'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className="input w-full pl-12"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                    className="btn btn-ghost btn-sm absolute left-1 top-1"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  className="btn btn-primary gap-2 order-1"
                  disabled={savingPassword}
                >
                  {savingPassword ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {needsToSetPassword ? 'در حال تنظیم...' : 'در حال تغییر...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {needsToSetPassword ? 'تنظیم رمز عبور' : 'تغییر رمز عبور'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError(null)
                  }}
                  className="btn btn-ghost order-2"
                  disabled={savingPassword}
                >
                  لغو
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card bg-error/5 border-2 border-error">
        <div className="card-body p-4 md:p-8">
          <div className="flex items-center gap-2 pb-3 border-b border-error/30 mb-4 md:mb-6">
            <AlertTriangle className="w-5 h-5 text-error" />
            <h3 className="card-title text-lg text-error">منطقه خطرناک</h3>
          </div>

          {!showDeleteConfirm ? (
            <div className="space-y-4">
              <div className="bg-base-100 rounded-lg p-3 md:p-4 border-2 border-error/30">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium mb-1 text-error">حذف دائمی حساب کاربری</div>
                    <p className="text-xs md:text-sm text-base-content/60">
                      پس از حذف حساب کاربری، راه بازگشتی وجود ندارد. تمام داده‌ها، سفارشات، و
                      آدرس‌های شما برای همیشه حذف می‌شوند.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-error btn-outline gap-2"
              >
                <Trash2 className="w-4 h-4" />
                حذف حساب کاربری
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="alert alert-warning">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold mb-1">آیا کاملاً مطمئن هستید؟</div>
                  <p className="text-xs md:text-sm opacity-90">
                    این عمل قابل بازگشت نیست. این کار حساب شما را برای همیشه حذف کرده و تمام
                    اطلاعاتتان را از سرورهای ما پاک خواهد کرد.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-error gap-2 order-1"
                  disabled={deletingAccount}
                >
                  {deletingAccount ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      در حال حذف...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      بله، حساب من را حذف کن
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-ghost order-2"
                  disabled={deletingAccount}
                >
                  لغو
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
