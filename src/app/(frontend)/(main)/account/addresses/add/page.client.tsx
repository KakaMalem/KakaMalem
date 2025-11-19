'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { AddressForm } from '@/app/(frontend)/components/AddressForm'

type Address = NonNullable<User['addresses']>[number]

interface AddAddressClientProps {
  user: User
}

export default function AddAddressClient({ user }: AddAddressClientProps) {
  const router = useRouter()

  const handleSave = async (formData: Partial<Address>) => {
    const addresses = user.addresses || []

    const newAddress = {
      ...formData,
      id: `addr_${Date.now()}`,
    } as Address

    // If this address is set as default, unset other defaults
    let updatedAddresses = [...addresses, newAddress]
    if (formData.isDefault) {
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
      body: JSON.stringify({ addresses: updatedAddresses }),
    })

    if (!response.ok) {
      throw new Error('Failed to save address')
    }

    toast.success('Address added successfully!')
    router.push('/account/addresses')
  }

  const handleCancel = () => {
    router.push('/account/addresses')
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/account/addresses" className="btn btn-ghost btn-sm gap-2 mb-4 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Addresses
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Add New Address</h1>
        <p className="text-base-content/60 text-sm mt-1">
          Add a delivery address with GPS location and landmark
        </p>
      </div>

      {/* Form Card */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body p-4 sm:p-6">
          <AddressForm onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  )
}
