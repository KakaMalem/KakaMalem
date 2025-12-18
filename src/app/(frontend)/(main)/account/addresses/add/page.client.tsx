'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { User } from '@/payload-types'
import { AddressForm } from '@/app/(frontend)/components/AddressForm'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'

type Address = NonNullable<User['addresses']>[number]

interface AddAddressClientProps {
  user: User
  redirectTo?: string
}

export default function AddAddressClient({ user, redirectTo }: AddAddressClientProps) {
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

    toast.success('آدرس مؤفقانه ثبت شد!')
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
          { label: 'افزودن آدرس جدید', active: true },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">افزودن آدرس جدید</h1>
        <p className="text-base-content/60 text-sm mt-1">
          یک آدرس تحویل با موقعیت GPS و نشانی اضافه کنید
        </p>
      </div>

      {/* Form Card */}
      <div className="card bg-base-200 shadow-xl max-w-3xl">
        <div className="card-body p-4 sm:p-6">
          <AddressForm onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  )
}
