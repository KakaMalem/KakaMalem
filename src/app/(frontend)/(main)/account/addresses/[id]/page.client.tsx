'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { AddressForm } from '@/app/(frontend)/components/AddressForm'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

type Address = NonNullable<User['addresses']>[number]

interface EditAddressClientProps {
  user: User
  address: Address
  redirectTo?: string
}

export default function EditAddressClient({ user, address, redirectTo }: EditAddressClientProps) {
  const router = useRouter()

  const handleSave = async (formData: Partial<Address>) => {
    const addresses = user.addresses || []

    // Update existing address
    let updatedAddresses = addresses.map((addr) =>
      addr.id === address.id ? { ...addr, ...formData } : addr,
    )

    // If this address is set as default, unset other defaults
    if (formData.isDefault) {
      updatedAddresses = updatedAddresses.map((addr) =>
        addr.id === address.id ? addr : { ...addr, isDefault: false },
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
      throw new Error('Failed to update address')
    }

    toast.success('تغیرات ثبت شد!')
    router.push(redirectTo || '/account/addresses')
  }

  const handleCancel = () => {
    router.push(redirectTo || '/account/addresses')
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'حساب کاربری', href: '/account' },
          { label: 'آدرس‌ها', href: '/account/addresses' },
          { label: 'ویرایش آدرس', active: true },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">ویرایش آدرس</h1>
        <p className="text-base-content/60 text-sm mt-1">جزئیات آدرس تحویل خود را به‌روز کنید</p>
      </div>

      {/* Form Card */}
      <div className="card bg-base-200 shadow-xl max-w-3xl">
        <div className="card-body p-4 sm:p-6">
          <AddressForm initialData={address} onSave={handleSave} onCancel={handleCancel} isEdit />
        </div>
      </div>
    </div>
  )
}
