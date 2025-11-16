'use client'

import React, { useState } from 'react'
import { Edit2, Save, X, Package, Heart, MapPin, ShoppingBag, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { User as PayloadUser, Order } from '@/payload-types'

interface AccountClientProps {
  user: PayloadUser
  orders: Order[]
}

export default function AccountClient({ user: initialUser, orders }: AccountClientProps) {
  const [user, setUser] = useState(initialUser)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: initialUser.firstName || '',
    lastName: initialUser.lastName || '',
    phone: initialUser.phone || '',
  })

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedData = await response.json()
      setUser(updatedData.doc || updatedData)
      toast.success('Profile updated successfully!')
      setEditMode(false)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      delivered: 'badge-success',
      shipped: 'badge-info',
      processing: 'badge-warning',
      cancelled: 'badge-accent',
    }
    return badges[status] || 'badge-ghost'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Account Overview</h2>
          <p className="text-base-content/70 mt-1 text-sm md:text-base">
            Welcome back, {user.firstName || 'User'}!
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-outline btn-sm md:btn-md gap-2"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSaveProfile}
              className="btn btn-primary btn-sm md:btn-md gap-2"
              disabled={saving}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={() => {
                setEditMode(false)
                setFormData({
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  phone: user.phone || '',
                })
              }}
              className="btn btn-ghost btn-sm md:btn-md gap-2"
              disabled={saving}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">First Name</span>
              </label>
              {editMode ? (
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              ) : (
                <p className="py-3">{user.firstName}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Last Name</span>
              </label>
              {editMode ? (
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              ) : (
                <p className="py-3">{user.lastName}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              <p className="py-3 text-base-content/70">{user.email}</p>
              {editMode && (
                <span className="text-xs text-base-content/50 mt-1">
                  Email cannot be changed from this page
                </span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Phone</span>
              </label>
              {editMode ? (
                <input
                  type="tel"
                  className="input input-bordered"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="py-3">{user.phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Link
          href="/account/orders"
          className="card bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-shadow"
        >
          <div className="card-body p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
              <div className="p-2 md:p-3 bg-primary/20 rounded-lg mb-2 md:mb-0">
                <Package className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">{orders.length}</div>
                <div className="text-xs md:text-sm text-base-content/70">Total Orders</div>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/account/wishlist"
          className="card bg-gradient-to-br from-error/10 to-error/5 hover:shadow-lg transition-shadow"
        >
          <div className="card-body p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
              <div className="p-2 md:p-3 bg-error/20 rounded-lg mb-2 md:mb-0">
                <Heart className="w-6 h-6 md:w-8 md:h-8 text-error" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">0</div>
                <div className="text-xs md:text-sm text-base-content/70">Wishlist Items</div>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/account/addresses"
          className="card bg-gradient-to-br from-success/10 to-success/5 hover:shadow-lg transition-shadow"
        >
          <div className="card-body p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
              <div className="p-2 md:p-3 bg-success/20 rounded-lg mb-2 md:mb-0">
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-success" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold">{user.addresses?.length || 0}</div>
                <div className="text-xs md:text-sm text-base-content/70">Saved Addresses</div>
              </div>
            </div>
          </div>
        </Link>

        <div className="card bg-gradient-to-br from-info/10 to-info/5">
          <div className="card-body p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:gap-4 text-center md:text-left">
              <div className="p-2 md:p-3 bg-info/20 rounded-lg mb-2 md:mb-0">
                <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 text-info" />
              </div>
              <div>
                <div className="text-xl font-bold">
                  {user.roles?.includes('admin') ? 'Admin' : 'Customer'}
                </div>
                <div className="text-xs md:text-sm text-base-content/70">Account Type</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-xl">Recent Orders</h3>
            {orders.length > 3 && (
              <Link href="/account/orders" className="btn btn-ghost btn-sm gap-2">
                View All
                <Package className="w-4 h-4" />
              </Link>
            )}
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })

                return (
                  <Link
                    key={order.id}
                    href={`/account/orders`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-base-100 rounded-lg hover:shadow-md transition-shadow gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base md:text-lg truncate">
                        Order #{order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-base-content/70">{orderDate}</div>
                      <div className="text-xs text-base-content/50 mt-1">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className="font-bold text-base md:text-lg mb-1">
                        USD {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
                      </div>
                      <span
                        className={`badge badge-sm ${getStatusBadge(order.status || 'pending')}`}
                      >
                        {order.status || 'pending'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <p className="text-base-content/70 mb-4">No orders yet</p>
              <Link href="/shop" className="btn btn-primary gap-2">
                <ShoppingBag className="w-4 h-4" />
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
