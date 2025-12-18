'use client'

import React from 'react'
import { CreditCard } from 'lucide-react'

interface PaymentStepProps {
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card'
  setPaymentMethod: (method: 'cod' | 'bank_transfer' | 'credit_card') => void
}

export function PaymentStep({ paymentMethod, setPaymentMethod }: PaymentStepProps) {
  const paymentMethods = [
    {
      value: 'cod' as const,
      label: 'پرداخت هنگام تحویل',
      desc: 'هنگام دریافت سفارش پرداخت کنید',
      available: true,
    },
    {
      value: 'bank_transfer' as const,
      label: 'انتقال بانکی',
      desc: 'واریز به حساب بانکی ما',
      available: false,
    },
    {
      value: 'credit_card' as const,
      label: 'کارت اعتباری',
      desc: 'پرداخت امن با کارت اعتباری',
      available: false,
    },
  ]

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          روش پرداخت
        </h2>

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.value}
              className={`p-4 rounded-lg border-2 transition-all ${
                method.available
                  ? paymentMethod === method.value
                    ? 'border-primary bg-primary/5 cursor-pointer'
                    : 'border-base-300 hover:border-base-content/20 cursor-pointer'
                  : 'border-base-300 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => method.available && setPaymentMethod(method.value)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  className="radio radio-primary"
                  checked={paymentMethod === method.value}
                  onChange={() => method.available && setPaymentMethod(method.value)}
                  disabled={!method.available}
                />
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {method.label}
                    {!method.available && (
                      <span className="badge badge-warning badge-sm">به زودی</span>
                    )}
                  </div>
                  <div className="text-sm opacity-70">{method.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
