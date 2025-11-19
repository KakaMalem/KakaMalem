'use client'

import React, { useState } from 'react'
import { MapPin, Edit2, Trash2, Plus, Home, Building, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { User } from '@/payload-types'

interface AddressesClientProps {
  user: User
}

type Address = NonNullable<User['addresses']>[number]

export default function AddressesClient({ user: initialUser }: AddressesClientProps) {
  const [user, setUser] = useState(initialUser)
  const [deleting, setDeleting] = useState<string | null>(null)

  const addresses = user.addresses || []

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    setDeleting(addressId)
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
      setDeleting(null)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setDeleting(addressId)
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
      setDeleting(null)
    }
  }

  const getLabelIcon = (label: string) => {
    const lower = label.toLowerCase()
    if (lower.includes('home')) return <Home className="w-5 h-5" />
    if (lower.includes('office') || lower.includes('work')) return <Building className="w-5 h-5" />
    return <MapPin className="w-5 h-5" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Delivery Addresses</h2>
          <p className="text-base-content/60 text-sm mt-1">
            {addresses.length > 0
              ? `${addresses.length} ${addresses.length === 1 ? 'address' : 'addresses'} saved`
              : 'No addresses yet'}
          </p>
        </div>
        <Link href="/account/addresses/add" className="btn btn-primary gap-2 btn-sm sm:btn-md">
          <Plus className="w-4 h-4" />
          Add Address
        </Link>
      </div>

      {/* Addresses Grid */}
      {addresses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`card bg-base-100 hover:shadow-xl transition-all border ${
                address.isDefault ? 'border-primary shadow-lg' : 'border-base-300'
              }`}
            >
              <div className="card-body p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${address.isDefault ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content'}`}
                    >
                      {getLabelIcon(address.label)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{address.label}</h3>
                      {address.isDefault && (
                        <span className="badge badge-primary badge-sm gap-1 mt-0.5">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Basic Info */}
                  <div className="space-y-1">
                    <p className="font-semibold text-base">
                      {address.firstName} {address.lastName}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-base-content/70">
                      {address.state && (
                        <span className="badge badge-sm badge-ghost">{address.state}</span>
                      )}
                      <span className="badge badge-sm badge-ghost">{address.country}</span>
                      {address.phone && (
                        <span className="badge badge-sm badge-ghost">{address.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Location Details */}
                  {(address.nearbyLandmark ||
                    address.detailedDirections ||
                    address.coordinates) && (
                    <div className="bg-base-200/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Delivery Location</span>
                      </div>

                      {address.nearbyLandmark && (
                        <div className="text-sm">
                          <span className="font-medium">Landmark:</span>
                          <span className="ml-1 text-base-content/80">
                            {address.nearbyLandmark}
                          </span>
                        </div>
                      )}

                      {address.detailedDirections && (
                        <p className="text-xs text-base-content/70 leading-relaxed">
                          {address.detailedDirections.length > 100
                            ? address.detailedDirections.substring(0, 100) + '...'
                            : address.detailedDirections}
                        </p>
                      )}

                      {address.coordinates?.latitude && address.coordinates?.longitude && (
                        <button
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${address.coordinates?.latitude},${address.coordinates?.longitude}`,
                              '_blank',
                            )
                          }
                          className="btn btn-xs btn-primary gap-1 mt-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Open in Maps
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-base-300">
                  <Link
                    href={`/account/addresses/${address.id}`}
                    className="btn btn-sm btn-outline gap-1 flex-1 sm:flex-none"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id!)}
                      className="btn btn-sm btn-ghost gap-1 flex-1 sm:flex-none"
                      disabled={deleting === address.id}
                    >
                      <Star className="w-3.5 h-3.5" />
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(address.id!)}
                    className="btn btn-sm btn-ghost gap-1 text-error flex-1 sm:flex-none ml-auto"
                    disabled={deleting === address.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting === address.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card bg-base-200/50 border-2 border-dashed border-base-300">
          <div className="card-body text-center py-16">
            <MapPin className="w-20 h-20 mx-auto text-base-content/20 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Delivery Addresses Yet</h3>
            <p className="text-base-content/60 mb-6 max-w-md mx-auto">
              Add your first address with GPS location and landmark to ensure smooth delivery.
            </p>
            <Link href="/account/addresses/add" className="btn btn-primary gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Add Your First Address
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
