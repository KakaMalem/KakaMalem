'use client'

import React, { useState } from 'react'
import {
  Edit2,
  Save,
  X,
  Package,
  Heart,
  MapPin,
  ShoppingBag,
  Eye,
  User,
  Phone,
  Mail,
  ChevronLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { User as PayloadUser, Order } from '@/payload-types'
import { Breadcrumb } from '@/app/(frontend)/components/Breadcrumb'
import { RecentlyViewed } from '@/app/(frontend)/components/RecentlyViewed'

interface AccountClientProps {
  user: PayloadUser
  orders: Order[]
}

// Status configuration
const ORDER_STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  delivered: { badge: 'badge-success', label: 'تحویل شده' },
  shipped: { badge: 'badge-info', label: 'ارسال شده' },
  processing: { badge: 'badge-warning', label: 'در حال پروسس' },
  cancelled: { badge: 'badge-error', label: 'لغو شده' },
  pending: { badge: 'badge-ghost', label: 'در انتظار' },
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

  const getStatusConfig = (status: string) => {
    return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'حساب کاربری', active: true }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">خلاصه حساب کاربری</h2>
            <p className="text-base-content/70 mt-0.5 text-sm md:text-base">
              خوش آمدید، {user.firstName || 'کاربر'}!
            </p>
          </div>
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
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-lg mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            اطلاعات شخصی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-base-100 rounded-xl p-4 border border-base-300">
              <label className="text-sm text-base-content/60 flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5" />
                نام
              </label>
              {editMode ? (
                <input
                  type="text"
                  className="input w-full focus:ring-2 focus:ring-primary/30"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="نام خود را وارد کنید"
                />
              ) : (
                <p className="font-medium">{user.firstName || '—'}</p>
              )}
            </div>

            <div className="bg-base-100 rounded-xl p-4 border border-base-300">
              <label className="text-sm text-base-content/60 flex items-center gap-2 mb-2">
                <User className="w-3.5 h-3.5" />
                تخلص
              </label>
              {editMode ? (
                <input
                  type="text"
                  className="input w-full focus:ring-2 focus:ring-primary/30"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="تخلص خود را وارد کنید"
                />
              ) : (
                <p className="font-medium">{user.lastName || '—'}</p>
              )}
            </div>

            <div className="bg-base-100 rounded-xl p-4 border border-base-300">
              <label className="text-sm text-base-content/60 flex items-center gap-2 mb-2">
                <Mail className="w-3.5 h-3.5" />
                ایمیل
              </label>
              <p className="font-medium" dir="ltr">
                {user.email}
              </p>
              {editMode && (
                <span className="text-xs text-base-content/50 mt-1 block">
                  ایمیل از این صفحه قابل تغییر نیست
                </span>
              )}
            </div>

            <div className="bg-base-100 rounded-xl p-4 border border-base-300">
              <label className="text-sm text-base-content/60 flex items-center gap-2 mb-2">
                <Phone className="w-3.5 h-3.5" />
                شماره تماس
              </label>
              {editMode ? (
                <input
                  type="tel"
                  className="input w-full focus:ring-2 focus:ring-primary/30"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  dir="ltr"
                  placeholder="0712345678"
                />
              ) : (
                <p className="font-medium" dir="ltr">
                  {user.phone || 'ارائه نشده'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
                <div className="text-2xl md:text-3xl font-bold">{user.wishlist?.length || 0}</div>
                <div className="text-xs md:text-sm text-base-content/70">اقلام علاقه‌مندی</div>
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/account/addresses"
          className="card bg-gradient-to-br from-success/10 to-success/5 hover:shadow-lg transition-shadow col-span-2 lg:col-span-1"
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
      </div>

      {/* Recent Orders */}
      <div className="card bg-base-200 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              سفارشات اخیر
            </h3>
            {orders.length > 3 && (
              <Link href="/account/orders" className="btn btn-ghost btn-sm gap-1">
                مشاهده همه
                <ChevronLeft className="w-4 h-4" />
              </Link>
            )}
          </div>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString(
                  'fa-IR-u-ca-gregory',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  },
                )
                const statusConfig = getStatusConfig(order.status || 'pending')

                return (
                  <Link
                    key={order.id}
                    href={`/account/orders/${order.id}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-base-100 rounded-xl border border-base-300 hover:border-primary/30 hover:shadow-md transition-all gap-3 sm:gap-0 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base md:text-lg truncate group-hover:text-primary transition-colors">
                        سفارش #{order.orderNumber || order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-base-content/70">{orderDate}</div>
                      <div className="text-xs text-base-content/50 mt-1">
                        {order.items?.length || 0} قلم
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col items-center sm:items-end gap-2">
                      <div className="font-bold text-base md:text-lg text-primary">
                        {order.currency === 'USD' ? '$' : '؋'}{' '}
                        {typeof order.total === 'number' ? order.total.toLocaleString() : '0'}
                      </div>
                      <span
                        className={`badge badge-sm ${statusConfig.badge} whitespace-nowrap flex-shrink-0`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-base-content/30" />
              </div>
              <h4 className="font-bold text-lg mb-2">هنوز سفارشی ندارید</h4>
              <p className="text-base-content/70 mb-6 text-sm">
                با خرید اولین محصول، سفارشات شما اینجا نمایش داده می‌شود
              </p>
              <Link href="/" className="btn btn-primary gap-2">
                <ShoppingBag className="w-4 h-4" />
                شروع خرید
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Browsing History Section */}
      <div className="card bg-base-200 shadow-sm">
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
