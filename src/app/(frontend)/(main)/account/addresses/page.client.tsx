'use client'

import React, { useState } from 'react'
import {
  MapPin,
  Edit2,
  Trash2,
  Plus,
  X,
  Home,
  Building,
  Star,
  CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'

interface AddressesClientProps {
  user: User
}

type Address = NonNullable<User['addresses']>[number]

export default function AddressesClient({ user: initialUser }: AddressesClientProps) {
  const [user, setUser] = useState(initialUser)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Address>>({
    label: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    isDefault: false,
  })
  const [saving, setSaving] = useState(false)

  const addresses = user.addresses || []

  const resetForm = () => {
    setFormData({
      label: '',
      firstName: '',
      lastName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
      isDefault: false,
    })
    setShowAddForm(false)
    setEditingId(null)
  }

  const handleEdit = (address: Address) => {
    setFormData({
      label: address.label,
      firstName: address.firstName,
      lastName: address.lastName,
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      phone: address.phone || '',
      isDefault: address.isDefault || false,
    })
    setEditingId(address.id || null)
    setShowAddForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let updatedAddresses = [...addresses]

      if (editingId) {
        // Update existing address
        updatedAddresses = updatedAddresses.map((addr) =>
          addr.id === editingId ? { ...addr, ...formData } : addr,
        )
      } else {
        // Add new address
        const newAddress = {
          ...formData,
          id: `addr_${Date.now()}`,
        } as Address
        updatedAddresses.push(newAddress)
      }

      // If this address is set as default, unset other defaults
      if (formData.isDefault) {
        updatedAddresses = updatedAddresses.map((addr) =>
          addr.id === editingId || addr.id === `addr_${Date.now()}`
            ? addr
            : { ...addr, isDefault: false },
        )
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ addresses: updatedAddresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to save address')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success(editingId ? 'Address updated successfully!' : 'Address added successfully!')
      resetForm()
    } catch (err: any) {
      console.error('Error saving address:', err)
      toast.error('Failed to save address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setSaving(true)
    try {
      const updatedAddresses = addresses.filter((addr) => addr.id !== addressId)

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ addresses: updatedAddresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete address')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success('Address deleted successfully!')
    } catch (err: any) {
      console.error('Error deleting address:', err)
      toast.error('Failed to delete address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setSaving(true)
    try {
      const updatedAddresses = addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ addresses: updatedAddresses }),
      })

      if (!response.ok) {
        throw new Error('Failed to set default address')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success('Default address updated!')
    } catch (err: any) {
      console.error('Error setting default address:', err)
      toast.error('Failed to set default address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Saved Addresses</h2>
          <p className="text-base-content/70 mt-1">
            {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} saved
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn btn-primary gap-2"
          disabled={showAddForm}
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card bg-base-200 border-2 border-primary">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={resetForm}
                className="btn btn-ghost btn-sm btn-circle"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Address Label</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g., Home, Office"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">First Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Last Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Address Line 1</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Address Line 2 (Optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">City</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">State / Province</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Postal Code</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Country</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Phone Number</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={formData.isDefault || false}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <span className="label-text font-medium">Set as default address</span>
                </label>
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button onClick={resetForm} className="btn btn-ghost" disabled={saving}>
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  'Save Address'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addresses Grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => {
            const getLabelIcon = (label: string) => {
              const lower = label.toLowerCase()
              if (lower.includes('home')) return <Home className="w-5 h-5" />
              if (lower.includes('office') || lower.includes('work'))
                return <Building className="w-5 h-5" />
              return <MapPin className="w-5 h-5" />
            }

            return (
              <div
                key={address.id}
                className={`card bg-base-200 hover:shadow-lg transition-shadow ${
                  address.isDefault ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        {getLabelIcon(address.label)}
                      </div>
                      <div>
                        <h3 className="font-bold">{address.label}</h3>
                        {address.isDefault && (
                          <span className="badge badge-primary badge-sm gap-1 mt-1">
                            <Star className="w-3 h-3" fill="currentColor" />
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm space-y-1 mt-3">
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-base-content/70">{address.address1}</p>
                    {address.address2 && <p className="text-base-content/70">{address.address2}</p>}
                    <p className="text-base-content/70">
                      {address.city}
                      {address.state && `, ${address.state}`} {address.postalCode}
                    </p>
                    <p className="text-base-content/70">{address.country}</p>
                    {address.phone && <p className="text-base-content/70">{address.phone}</p>}
                  </div>

                  <div className="card-actions justify-between mt-4 pt-4 border-t border-base-300">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(address)}
                        className="btn btn-ghost btn-sm gap-1"
                        disabled={saving}
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(address.id!)}
                        className="btn btn-ghost btn-sm gap-1 text-error"
                        disabled={saving}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id!)}
                        className="btn btn-ghost btn-sm gap-1"
                        disabled={saving}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body text-center py-12">
            <MapPin className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Addresses Saved</h3>
            <p className="text-base-content/70 mb-6">
              Add your first address to make checkout faster and easier.
            </p>
            <button onClick={() => setShowAddForm(true)} className="btn btn-primary mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Address
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
