'use client'

import React, { useEffect, useState } from 'react'
import { getMockUser } from '@/lib/mockUser'

export default function AddressesPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setUser(getMockUser())
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Saved Addresses</h2>
        <button className="btn btn-primary btn-sm">Add New Address</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user?.addresses?.map((address: any) => (
          <div key={address.id} className="card bg-base-200">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <h3 className="font-bold">{address.label}</h3>
                {address.isDefault && <span className="badge badge-primary badge-sm">Default</span>}
              </div>

              <div className="text-sm space-y-1 mt-2">
                <p className="font-medium">
                  {address.firstName} {address.lastName}
                </p>
                <p>{address.address1}</p>
                {address.address2 && <p>{address.address2}</p>}
                <p>
                  {address.city}, {address.state} {address.postalCode}
                </p>
                <p>{address.country}</p>
                <p>{address.phone}</p>
              </div>

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-ghost btn-xs">Edit</button>
                <button className="btn btn-ghost btn-xs text-accent">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
