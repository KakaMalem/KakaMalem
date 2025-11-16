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
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'

interface SettingsClientProps {
  user: User
}

export default function SettingsClient({ user: initialUser }: SettingsClientProps) {
  const [user, setUser] = useState(initialUser)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Preferences state
  const [newsletter, setNewsletter] = useState(user.preferences?.newsletter || false)
  const [currency, setCurrency] = useState<'USD' | 'AF'>(user.preferences?.currency || 'USD')

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
    setSaving(true)
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
      toast.success('Preferences updated successfully!')
    } catch (err: any) {
      console.error('Error updating preferences:', err)
      toast.error('Failed to update preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      // Note: This endpoint might need to be adjusted based on your Payload setup
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to change password')
      }

      toast.success('Password changed successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err: any) {
      console.error('Error changing password:', err)
      setPasswordError('Failed to change password. Please check your current password.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      // Redirect to home after deletion
      toast.success('Account deleted successfully')
      window.location.href = '/'
    } catch (err: any) {
      console.error('Error deleting account:', err)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Account Settings</h2>
        <p className="text-base-content/70 mt-1">Manage your account preferences and security</p>
      </div>

      {/* Preferences */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">Preferences</h3>
          </div>

          <div className="space-y-6">
            {/* Newsletter */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <div>
                  <div className="font-medium">Newsletter Subscription</div>
                  <div className="text-sm text-base-content/70">
                    Receive updates about new products and exclusive offers
                  </div>
                </div>
              </label>
            </div>

            {/* Currency */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Preferred Currency
                </span>
              </label>
              <select
                className="select select-bordered w-full max-w-xs"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'USD' | 'AF')}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="AF">AFN - Afghan Afghani</option>
              </select>
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  This will be used for pricing throughout the site
                </span>
              </label>
            </div>

            {/* Save Button */}
            <div className="card-actions">
              <button
                onClick={handleSavePreferences}
                className="btn btn-primary gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg">Security</h3>
          </div>

          {!showPasswordForm ? (
            <div>
              <p className="text-sm text-base-content/70 mb-4">
                Keep your account secure by using a strong password
              </p>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="btn btn-outline gap-2"
              >
                <Lock className="w-4 h-4" />
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {passwordError && (
                <div className="alert alert-error">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    className="input input-bordered w-full pr-12"
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
                    className="btn btn-ghost btn-sm absolute right-1 top-1"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    className="input input-bordered w-full pr-12"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                    }
                    className="btn btn-ghost btn-sm absolute right-1 top-1"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Minimum 8 characters
                  </span>
                </label>
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    className="input input-bordered w-full pr-12"
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
                    className="btn btn-ghost btn-sm absolute right-1 top-1"
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
              <div className="flex gap-2">
                <button
                  onClick={handleChangePassword}
                  className="btn btn-primary gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Changing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError(null)
                  }}
                  className="btn btn-ghost"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card bg-error/10 border-2 border-error/50">
        <div className="card-body">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-error" />
            <h3 className="card-title text-lg text-error">Danger Zone</h3>
          </div>

          {!showDeleteConfirm ? (
            <div>
              <p className="text-sm text-base-content/70 mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-error btn-outline gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="alert alert-warning">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <h4 className="font-bold">Are you absolutely sure?</h4>
                  <p className="text-sm">
                    This action cannot be undone. This will permanently delete your account and
                    remove all your data from our servers.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  className="btn btn-error gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Yes, Delete My Account
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-ghost"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
