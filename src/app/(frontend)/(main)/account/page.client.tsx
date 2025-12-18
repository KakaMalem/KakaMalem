'use client'

import React, { useState } from 'react'
import { Edit2, Save, X, Package, Heart, MapPin, ShoppingBag, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { User as PayloadUser, Order } from '@/payload-types'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'
import { RecentlyViewed } from '@/app/(frontend)/components/RecentlyViewed'

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
      toast.success('تغیرات ثبت شد!')
      setEditMode(false)
    } catch (err: unknown) {
      console.error('Error updating profile:', err)
      toast.error('تغیر پروفایل ناموفق بود. لطفاً دوباره امتحان کنید.')
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
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'حساب کاربری', active: true }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">خلاصه حساب کاربری</h2>
          <p className="text-base-content/70 mt-1 text-sm md:text-base">
            خوش آمدید، {user.firstName || 'کاربر'}!
          </p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-outline btn-sm md:btn-md gap-2"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">ویرایش پروفایل</span>
            <span className="sm:hidden">ویرایش</span>
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
              ذخیره
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
              <span className="hidden sm:inline">لغو</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4">اطلاعات شخصی</h3>
          <fieldset className="fieldset">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
              <div>
                <label className="label">نام</label>
                {editMode ? (
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                ) : (
                  <p className="py-3">{user.firstName}</p>
                )}
              </div>

              <div>
                <label className="label">تخلص</label>
                {editMode ? (
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                ) : (
                  <p className="py-3">{user.lastName}</p>
                )}
              </div>

              <div>
                <label className="label">ایمیل</label>
                <p className="py-3 text-base-content/70">{user.email}</p>
                {editMode && (
                  <span className="text-xs text-base-content/50">
                    ایمیل از این صفحه قابل تغییر نیست
                  </span>
                )}
              </div>

              <div>
                <label className="label">شماره تماس</label>
                {editMode ? (
                  <input
                    type="tel"
                    className="input w-full"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    dir="ltr"
                  />
                ) : (
                  <p className="py-3" dir="ltr">
                    {user.phone || 'ارائه نشده'}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
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
                <div className="text-xs md:text-sm text-base-content/70">مجموع سفارشات</div>
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
                <div className="text-xs md:text-sm text-base-content/70">اقلام علاقه‌مندی</div>
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
                <div className="text-xs md:text-sm text-base-content/70">آدرس‌های ذخیره شده</div>
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
                  {user.roles?.includes('admin') ? 'مدیر' : 'مشتری'}
                </div>
                <div className="text-xs md:text-sm text-base-content/70">نوع حساب</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-xl">سفارشات اخیر</h3>
            {orders.length > 3 && (
              <Link href="/account/orders" className="btn btn-ghost btn-sm gap-2">
                مشاهده همه
                <Package className="w-4 h-4" />
              </Link>
            )}
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })

                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-base-100 rounded-lg hover:shadow-md transition-shadow gap-3 sm:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base md:text-lg truncate">
                        سفارش #{order.orderNumber || order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-base-content/70">{orderDate}</div>
                      <div className="text-xs text-base-content/50 mt-1">
                        {order.items?.length || 0} قلم
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <div className="font-bold text-base md:text-lg mb-1">
                        {order.currency || 'AFN'}{' '}
                        {typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
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
              <p className="text-base-content/70 mb-4">هنوز سفارشی ندارید</p>
              <Link href="/" className="btn btn-primary gap-2">
                <ShoppingBag className="w-4 h-4" />
                شروع خرید
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Browsing History Section */}
      <div className="card bg-base-200">
        <div className="card-body">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">تاریخچه بازدید</h3>
              <p className="text-sm text-base-content/70">محصولاتی که اخیراً مشاهده کرده‌اید</p>
            </div>
          </div>
          <RecentlyViewed showTitle={false} />
        </div>
      </div>
    </div>
  )
}
