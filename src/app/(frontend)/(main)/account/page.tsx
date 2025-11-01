'use client'

import React, { useEffect, useState } from 'react'
import { Edit2, Save, X, Package, Heart, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getMockUser, getMockOrders } from '@/lib/mockUser'

export default function AccountOverviewPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  useEffect(() => {
    const u = getMockUser()
    const o = getMockOrders()
    setUser(u)
    setOrders(o)
    setFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
    })
    setLoading(false)
  }, [])

  const handleSaveProfile = () => {
    setUser({ ...user, ...formData })
    setEditMode(false)
  }

  if (loading) return null

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Account Overview</h2>
        {!editMode ? (
          <button onClick={() => setEditMode(true)} className="btn btn-outline btn-sm">
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSaveProfile} className="btn btn-primary btn-sm">
              <Save className="w-4 h-4" />
              Save
            </button>
            <button onClick={() => setEditMode(false)} className="btn btn-ghost btn-sm">
              <X className="w-4 h-4" />
              Cancel
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
                <p className="py-3">{user?.firstName}</p>
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
                <p className="py-3">{user?.lastName}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email</span>
              </label>
              {editMode ? (
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="py-3">{user?.email}</p>
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
                <p className="py-3">{user?.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <Package className="w-10 h-10 text-primary" />
              <div>
                <div className="text-2xl font-bold">{orders.length}</div>
                <div className="text-sm opacity-70">Total Orders</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <Heart className="w-10 h-10 text-primary" />
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm opacity-70">Wishlist Items</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <MapPin className="w-10 h-10 text-primary" />
              <div>
                <div className="text-2xl font-bold">{user?.addresses?.length || 0}</div>
                <div className="text-sm opacity-70">Saved Addresses</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-lg">Recent Orders</h3>
            <button
              onClick={() => (window.location.href = '/account/orders')}
              className="btn btn-ghost btn-sm"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-base-100 rounded-lg"
              >
                <div>
                  <div className="font-semibold">{order.orderNumber}</div>
                  <div className="text-sm opacity-70">{order.createdAt}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold">
                    {order.currency} {order.total}
                  </div>
                  <span className={`badge badge-sm ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
