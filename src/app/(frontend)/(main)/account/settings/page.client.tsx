'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
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
  Shield,
  Camera,
  User as UserIcon,
  Loader2,
  Phone,
  Mail,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

// Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

interface SettingsClientProps {
  user: User
}

export default function SettingsClient({ user: initialUser }: SettingsClientProps) {
  const [user, setUser] = useState(initialUser)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile editing state
  const [profileData, setProfileData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
  })

  // Auth methods from the new field
  const authMethods = (user.authMethods as string[]) || []
  const hasPasswordAuth = authMethods.includes('password')
  const hasGoogleAuth = authMethods.includes('google')

  // User needs to set password if they have Google auth but no password auth
  const needsToSetPassword = hasGoogleAuth && !hasPasswordAuth

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

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: profileData.firstName.trim() || null,
          lastName: profileData.lastName.trim() || null,
          phone: profileData.phone.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success('اطلاعات پروفایل با موفقیت ذخیره شد!')
    } catch (err: unknown) {
      console.error('Error updating profile:', err)
      toast.error('ذخیره اطلاعات پروفایل ناموفق بود. لطفاً دوباره امتحان کنید.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    // Validation - Users setting password for first time don't need current password
    if (needsToSetPassword) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('لطفاً رمز عبور جدید را وارد و تأیید کنید')
        return
      }
    } else {
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        setPasswordError('تمام فیلدها الزامی است')
        return
      }
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('رمز عبور جدید و تأیید آن یکسان نیستند')
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
        throw new Error(data.error || 'تنظیم رمز عبور ناموفق بود')
      }

      toast.success(data.message || 'رمز عبور با موفقیت ثبت شد!')

      // Update user state to reflect the new auth methods
      if (data.authMethods) {
        setUser({ ...user, authMethods: data.authMethods })
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err: unknown) {
      console.error('Error setting password:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'تنظیم رمز عبور ناموفق بود. لطفاً دوباره امتحان کنید.'
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

  const resetPasswordForm = () => {
    setShowPasswordForm(false)
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setPasswordError(null)
  }

  // Get profile picture URL - prioritize user-uploaded, then OAuth picture
  const getProfilePictureUrl = (): string | null => {
    // User-uploaded profile picture (from media collection)
    if (user.profilePicture) {
      const pic = user.profilePicture
      if (typeof pic === 'object' && pic !== null && 'url' in pic) {
        return pic.url as string
      }
    }
    // OAuth profile picture (from Google)
    if (user.picture) {
      return user.picture
    }
    return null
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً یک فایل تصویر انتخاب کنید')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد')
      return
    }

    setUploadingPicture(true)

    try {
      // First upload the image to media collection
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', `${user.firstName || 'User'} ${user.lastName || ''} Profile Picture`)

      const uploadResponse = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('آپلود تصویر ناموفق بود')
      }

      const uploadData = await uploadResponse.json()
      const mediaId = uploadData.doc?.id

      if (!mediaId) {
        throw new Error('آپلود تصویر ناموفق بود')
      }

      // Then update user with the new profile picture
      const updateResponse = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          profilePicture: mediaId,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error('ذخیره تصویر پروفایل ناموفق بود')
      }

      const updatedData = await updateResponse.json()
      setUser(updatedData.doc || updatedData)
      toast.success('تصویر پروفایل با موفقیت به‌روزرسانی شد!')
    } catch (err: unknown) {
      console.error('Error uploading profile picture:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'آپلود تصویر ناموفق بود. لطفاً دوباره امتحان کنید.'
      toast.error(errorMessage)
    } finally {
      setUploadingPicture(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveProfilePicture = async () => {
    if (!user.profilePicture) return

    setUploadingPicture(true)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          profilePicture: null,
        }),
      })

      if (!response.ok) {
        throw new Error('حذف تصویر پروفایل ناموفق بود')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success('تصویر پروفایل حذف شد')
    } catch (err: unknown) {
      console.error('Error removing profile picture:', err)
      toast.error('حذف تصویر پروفایل ناموفق بود')
    } finally {
      setUploadingPicture(false)
    }
  }

  const profilePictureUrl = getProfilePictureUrl()

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

      {/* Profile Picture */}
      <div className="card bg-base-100 border-2 border-base-300">
        <div className="card-body p-4 md:p-8">
          <div className="flex items-center gap-2 pb-3 border-b border-base-300 mb-4 md:mb-6">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">تصویر پروفایل</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Current Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-base-200 border-4 border-base-300 flex items-center justify-center">
                {profilePictureUrl ? (
                  <Image
                    src={profilePictureUrl}
                    alt="تصویر پروفایل"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-12 h-12 md:w-16 md:h-16 text-base-content/30" />
                )}
              </div>
              {uploadingPicture && (
                <div className="absolute inset-0 bg-base-100/80 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 text-center sm:text-right space-y-3">
              <div>
                <p className="font-medium mb-1">تصویر پروفایل خود را آپلود کنید</p>
                <p className="text-sm text-base-content/60">
                  فرمت‌های مجاز: JPG، PNG، GIF - حداکثر ۵ مگابایت
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  id="profile-picture-input"
                />
                <label
                  htmlFor="profile-picture-input"
                  className={`btn btn-primary btn-sm gap-2 ${uploadingPicture ? 'btn-disabled' : ''}`}
                >
                  <Camera className="w-4 h-4" />
                  {profilePictureUrl ? 'تغییر تصویر' : 'آپلود تصویر'}
                </label>

                {user.profilePicture && (
                  <button
                    onClick={handleRemoveProfilePicture}
                    className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
                    disabled={uploadingPicture}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                )}
              </div>

              {user.picture && !user.profilePicture && (
                <p className="text-xs text-base-content/50">
                  در حال استفاده از تصویر حساب گوگل شما
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card bg-base-100 border-2 border-base-300">
        <div className="card-body p-4 md:p-8">
          <div className="flex items-center gap-2 pb-3 border-b border-base-300 mb-4 md:mb-6">
            <UserIcon className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">اطلاعات پروفایل</h3>
          </div>

          <div className="space-y-4">
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="fieldset">
                <label className="label pb-1">
                  <span className="label-text font-medium">نام</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="نام خود را وارد کنید"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                />
              </div>

              <div className="fieldset">
                <label className="label pb-1">
                  <span className="label-text font-medium">نام خانوادگی</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="نام خانوادگی خود را وارد کنید"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="fieldset">
              <label className="label pb-1">
                <span className="label-text font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  ایمیل
                </span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                value={user.email}
                disabled
                readOnly
              />
              <p className="text-xs text-base-content/50 mt-1">ایمیل قابل تغییر نیست</p>
            </div>

            {/* Phone */}
            <div className="fieldset">
              <label className="label pb-1">
                <span className="label-text font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  شماره تلفن
                </span>
              </label>
              <input
                type="tel"
                className="input input-bordered w-full"
                placeholder="مثال: 0799123456"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                dir="ltr"
              />
            </div>

            {/* Save Button */}
            <div className="card-actions pt-2">
              <button
                onClick={handleSaveProfile}
                className="btn btn-primary gap-2"
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    ذخیره اطلاعات
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Auth Methods */}
      <div className="card bg-base-100 border-2 border-base-300">
        <div className="card-body p-4 md:p-8">
          <div className="flex items-center gap-2 pb-3 border-b border-base-300 mb-4 md:mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">امنیت و روش‌های ورود</h3>
          </div>

          {/* Auth Methods List */}
          <div className="space-y-3 mb-6">
            {/* Google Auth */}
            <div
              className={`flex items-center gap-3 p-3 md:p-4 rounded-lg border-2 transition-colors ${
                hasGoogleAuth
                  ? 'bg-success/5 border-success/30'
                  : 'bg-base-200 border-base-300 opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-base-300 flex-shrink-0">
                <GoogleIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">ورود با گوگل</div>
                <p className="text-xs text-base-content/60">
                  {hasGoogleAuth ? 'حساب گوگل شما متصل است' : 'برای اتصال، با گوگل وارد شوید'}
                </p>
              </div>
              {hasGoogleAuth && (
                <span className="badge badge-success gap-1">
                  <CheckCircle className="w-3 h-3" />
                  متصل
                </span>
              )}
            </div>

            {/* Password Auth */}
            <div
              className={`flex items-center gap-3 p-3 md:p-4 rounded-lg border-2 transition-colors ${
                hasPasswordAuth ? 'bg-success/5 border-success/30' : 'bg-base-200 border-base-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  hasPasswordAuth ? 'bg-success/10' : 'bg-primary/10'
                }`}
              >
                <Lock className={`w-5 h-5 ${hasPasswordAuth ? 'text-success' : 'text-primary'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">ورود با رمز عبور</div>
                <p className="text-xs text-base-content/60">
                  {hasPasswordAuth
                    ? 'می‌توانید با ایمیل و رمز عبور وارد شوید'
                    : 'رمز عبور تنظیم نشده است'}
                </p>
              </div>
              {hasPasswordAuth ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="btn btn-ghost btn-sm"
                  disabled={showPasswordForm}
                >
                  تغییر
                </button>
              ) : (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="btn btn-primary btn-sm"
                  disabled={showPasswordForm}
                >
                  فعال‌سازی
                </button>
              )}
            </div>
          </div>

          {/* No auth methods warning */}
          {authMethods.length === 0 && (
            <div className="alert alert-warning mb-6">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                هیچ روش ورودی فعال نیست. لطفاً با پشتیبانی تماس بگیرید.
              </span>
            </div>
          )}

          {/* Password Form */}
          {showPasswordForm && (
            <div className="border-t border-base-300 pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">
                  {needsToSetPassword ? 'تنظیم رمز عبور' : 'تغییر رمز عبور'}
                </h4>
              </div>

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
                    با تنظیم رمز عبور، می‌توانید علاوه بر گوگل با ایمیل و رمز عبور هم وارد شوید.
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
                      className="input input-bordered w-full pl-12"
                      placeholder="رمز عبور فعلی را وارد کنید"
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
                      className="btn btn-ghost btn-sm absolute left-1 top-1/2 -translate-y-1/2"
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
                    className="input input-bordered w-full pl-12"
                    placeholder="حداقل ۸ کاراکتر"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="btn btn-ghost btn-sm absolute left-1 top-1/2 -translate-y-1/2"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                    className="input input-bordered w-full pl-12"
                    placeholder="رمز عبور را دوباره وارد کنید"
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
                    className="btn btn-ghost btn-sm absolute left-1 top-1/2 -translate-y-1/2"
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
                  className="btn btn-primary gap-2"
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
                      {needsToSetPassword ? 'تنظیم رمز عبور' : 'ذخیره رمز عبور جدید'}
                    </>
                  )}
                </button>
                <button
                  onClick={resetPasswordForm}
                  className="btn btn-ghost"
                  disabled={savingPassword}
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
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
                    دریافت اطلاعیه‌ها درباره محصولات جدید، پیشنهادات ویژه، و تخفیف‌های انحصاری
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

                <label className="label cursor-not-allowed justify-start gap-3 rounded-lg p-3 md:p-4 border-2 transition-all opacity-50 border-base-300 bg-base-200">
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
                </label>
              </div>
              <p className="text-xs text-base-content/60 mt-2">
                این واحد برای نمایش قیمت‌ها در سراسر سایت استفاده می‌شود
              </p>
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
                  className="btn btn-error gap-2"
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
                  className="btn btn-ghost"
                  disabled={deletingAccount}
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
