'use client'

import React from 'react'
import Link from 'next/link'
import { MapPin, Plus, Check } from 'lucide-react'
import type { User } from '@/payload-types'
import { LocationPicker } from '../LocationPicker'

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
  }
}

interface ShippingStepProps {
  user: User | null
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
  const userAddresses = user?.addresses || []

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Shipping Address
        </h2>

        {user ? (
          // Authenticated user - show saved addresses
          <>
            {userAddresses.length > 0 ? (
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
                            <span className="badge badge-primary badge-sm">Default</span>
                          )}
                        </div>
                        <div className="text-sm mt-1">
                          {address.firstName} {address.lastName}
                        </div>
                        {address.state && <div className="text-sm opacity-70">{address.state}</div>}
                        <div className="text-sm opacity-70">{address.country}</div>
                        {address.phone && (
                          <div className="text-sm opacity-70">Phone: {address.phone}</div>
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
                            GPS location set
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning">
                <span>You have no saved addresses. Please add one in your account settings.</span>
              </div>
            )}

            <Link
              href="/account/addresses?redirect=/checkout"
              className="btn btn-outline btn-sm mt-4"
            >
              <Plus className="w-4 h-4" />
              Manage Addresses
            </Link>
          </>
        ) : (
          // Guest user - show checkout form
          <div className="space-y-4">
            <div className="alert alert-info">
              <span>
                Checking out as guest. Want to save your info?{' '}
                <Link href="/auth/login?redirect=/checkout" className="link link-primary">
                  Login
                </Link>{' '}
                or{' '}
                <Link href="/auth/register?redirect=/checkout" className="link link-primary">
                  Register
                </Link>
              </span>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email *</span>
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="input input-bordered"
                value={guestForm.email}
                onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">First Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="John"
                  className="input input-bordered"
                  value={guestForm.firstName}
                  onChange={(e) => setGuestForm({ ...guestForm, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Last Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="input input-bordered"
                  value={guestForm.lastName}
                  onChange={(e) => setGuestForm({ ...guestForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Province / State</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Kabul, Herat"
                  className="input input-bordered"
                  value={guestForm.state}
                  onChange={(e) => setGuestForm({ ...guestForm, state: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Country *</span>
                </label>
                <input
                  type="text"
                  placeholder="Afghanistan"
                  className="input input-bordered"
                  value={guestForm.country}
                  onChange={(e) => setGuestForm({ ...guestForm, country: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Phone</span>
              </label>
              <input
                type="tel"
                placeholder="+93 XXX XXX XXX"
                className="input input-bordered"
                value={guestForm.phone}
                onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
              />
            </div>

            <div className="divider">Delivery Location (Optional)</div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Nearby Landmark</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Near Blue Mosque, Behind City Hospital"
                className="input input-bordered"
                value={guestForm.nearbyLandmark}
                onChange={(e) => setGuestForm({ ...guestForm, nearbyLandmark: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt">Help delivery find your location</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Detailed Directions</span>
              </label>
              <textarea
                placeholder="Provide detailed directions from the nearest landmark e.g., from shaheed square of shahr e naw, go towards zarghoona high school, after 20 meters you'll see institute of banking and finance of afghanistan, go to the alley infront of it, house number 306, in front of the qala e fathullah mosque"
                className="textarea textarea-bordered h-24"
                value={guestForm.detailedDirections}
                onChange={(e) => setGuestForm({ ...guestForm, detailedDirections: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt">
                  Include nearby buildings, turns, or reference points
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">GPS Location</span>
              </label>
              <LocationPicker
                onLocationSelect={(lat, lng) => {
                  setGuestForm({
                    ...guestForm,
                    coordinates: { latitude: lat, longitude: lng },
                  })
                }}
                latitude={guestForm.coordinates.latitude ?? undefined}
                longitude={guestForm.coordinates.longitude ?? undefined}
              />
              <label className="label">
                <span className="label-text-alt">
                  Set your exact location for accurate delivery
                </span>
              </label>
            </div>

            <div className="alert alert-info text-sm">
              <MapPin className="w-4 h-4" />
              <span>
                Adding GPS location and landmarks helps ensure smooth delivery. Create an account to
                save this information for future orders!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
