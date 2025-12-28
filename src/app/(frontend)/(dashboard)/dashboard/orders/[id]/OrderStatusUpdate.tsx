'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2, Package, Truck, CheckCircle, Clock, CreditCard } from 'lucide-react'

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: string
  currentPaymentStatus: string
}

export default function OrderStatusUpdate({
  orderId,
  currentStatus,
  currentPaymentStatus,
}: OrderStatusUpdateProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(currentPaymentStatus)

  // Sellers can only update to these delivery statuses
  const allowedStatuses = [
    { value: 'processing', label: 'در حال پردازش', icon: <Package className="w-4 h-4" /> },
    { value: 'shipped', label: 'ارسال شده', icon: <Truck className="w-4 h-4" /> },
    { value: 'delivered', label: 'تحویل شده', icon: <CheckCircle className="w-4 h-4" /> },
  ]

  // Sellers can only update to these payment statuses
  const allowedPaymentStatuses = [
    { value: 'pending', label: 'در انتظار پرداخت', icon: <Clock className="w-4 h-4" /> },
    { value: 'paid', label: 'پرداخت شده', icon: <CreditCard className="w-4 h-4" /> },
  ]

  // Check if current status allows updates
  // Only cancelled orders cannot have their delivery status changed
  // Delivered orders can still be changed back if needed
  const canUpdateDelivery = currentStatus !== 'cancelled'
  const canUpdatePayment = !['failed', 'refunded'].includes(currentPaymentStatus)

  const handleUpdate = async () => {
    const hasStatusChange = selectedStatus !== currentStatus
    const hasPaymentChange = selectedPaymentStatus !== currentPaymentStatus

    if (!hasStatusChange && !hasPaymentChange) {
      toast.error('هیچ تغییری انجام نشده است')
      return
    }

    setIsLoading(true)

    try {
      const updateData: { status?: string; paymentStatus?: string } = {}
      if (hasStatusChange) updateData.status = selectedStatus
      if (hasPaymentChange) updateData.paymentStatus = selectedPaymentStatus

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'خطا در بروزرسانی وضعیت')
      }

      toast.success('وضعیت سفارش با موفقیت بروزرسانی شد')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در بروزرسانی وضعیت')
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges =
    selectedStatus !== currentStatus || selectedPaymentStatus !== currentPaymentStatus

  if (!canUpdateDelivery && !canUpdatePayment) {
    return (
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">بروزرسانی وضعیت</h3>
          <div className="alert">
            <span>امکان تغییر وضعیت این سفارش وجود ندارد.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-base-200">
      <div className="card-body space-y-6">
        <div>
          <h3 className="card-title text-lg">بروزرسانی وضعیت</h3>
          <p className="text-sm text-base-content/60">
            وضعیت سفارش را بروزرسانی کنید تا مشتری از روند پردازش مطلع شود.
          </p>
        </div>

        {/* Delivery Status */}
        {canUpdateDelivery ? (
          <div>
            <h4 className="font-medium mb-3">وضعیت ارسال</h4>
            <div className="flex flex-wrap gap-2">
              {allowedStatuses.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setSelectedStatus(status.value)}
                  className={`btn btn-sm gap-2 ${
                    selectedStatus === status.value ? 'btn-primary' : 'btn-ghost bg-base-300'
                  }`}
                  disabled={isLoading}
                >
                  {status.icon}
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            <span>این سفارش لغو شده است.</span>
          </div>
        )}

        {/* Payment Status */}
        {canUpdatePayment ? (
          <div>
            <h4 className="font-medium mb-3">وضعیت پرداخت</h4>
            <div className="flex flex-wrap gap-2">
              {allowedPaymentStatuses.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setSelectedPaymentStatus(status.value)}
                  className={`btn btn-sm gap-2 ${
                    selectedPaymentStatus === status.value ? 'btn-success' : 'btn-ghost bg-base-300'
                  }`}
                  disabled={isLoading}
                >
                  {status.icon}
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">
            <span>وضعیت پرداخت قابل تغییر نیست.</span>
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={isLoading || !hasChanges}
          className="btn btn-primary w-full gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              در حال بروزرسانی...
            </>
          ) : (
            'ذخیره تغییرات'
          )}
        </button>
      </div>
    </div>
  )
}
