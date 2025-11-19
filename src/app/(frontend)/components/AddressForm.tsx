'use client'

import React, { useState } from 'react'
import { MapPin, Home, Check, X } from 'lucide-react'
import { LocationPicker } from './LocationPicker'
import type { User } from '@/payload-types'

type Address = NonNullable<User['addresses']>[number]

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
    state: initialData?.state || '',
    country: initialData?.country || '',
    phone: initialData?.phone || '',
    isDefault: initialData?.isDefault || false,
    nearbyLandmark: initialData?.nearbyLandmark || '',
    detailedDirections: initialData?.detailedDirections || '',
    coordinates: initialData?.coordinates,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-base-300">
          <Home className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Basic Information</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-medium">Address Label *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="e.g., Home, Office"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">First Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Last Name *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Province / State</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="e.g., Kabul, Herat, Kandahar"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Country *</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Afghanistan"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
            />
          </div>

          <div className="form-control md:col-span-2">
            <label className="label">
              <span className="label-text font-medium">Phone Number</span>
            </label>
            <input
              type="tel"
              className="input input-bordered"
              placeholder="+93 XXX XXX XXX"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Location Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-base-300">
          <MapPin className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Location & Delivery Instructions</h4>
        </div>

        {/* Nearby Landmark */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Nearby Landmark</span>
            <span className="label-text-alt text-info">Recommended</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="e.g., Near Blue Mosque, Behind Ariana Market"
            value={formData.nearbyLandmark || ''}
            onChange={(e) => setFormData({ ...formData, nearbyLandmark: e.target.value })}
          />
          <label className="label">
            <span className="label-text-alt text-xs">Well-known place near your location</span>
          </label>
        </div>

        {/* Detailed Directions */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Detailed Directions</span>
            <span className="label-text-alt text-info">Recommended</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-20"
            placeholder="From the landmark, walk north 200m, turn right at the bakery..."
            value={formData.detailedDirections || ''}
            onChange={(e) => setFormData({ ...formData, detailedDirections: e.target.value })}
          />
          <label className="label">
            <span className="label-text-alt text-xs">
              Step-by-step directions from landmark to your door
            </span>
          </label>
        </div>

        {/* GPS Location Picker */}
        <div>
          <LocationPicker
            latitude={formData.coordinates?.latitude ?? undefined}
            longitude={formData.coordinates?.longitude ?? undefined}
            onLocationSelect={(lat, lng) =>
              setFormData({
                ...formData,
                coordinates: { latitude: lat, longitude: lng },
              })
            }
          />
        </div>

        {/* Default Address Checkbox */}
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3 bg-base-200 rounded-lg p-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={formData.isDefault || false}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            <div>
              <span className="label-text font-medium">Set as default address</span>
              <p className="text-xs text-base-content/60 mt-1">
                Use this address by default for checkout
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-base-300">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost btn-wide"
          disabled={saving}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-wide" disabled={saving}>
          {saving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {isEdit ? 'Update Address' : 'Save Address'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
