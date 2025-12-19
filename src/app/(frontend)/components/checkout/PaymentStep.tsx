'use client'

import React from 'react'
import { CreditCard, Wallet, Building2, CreditCardIcon, Check } from 'lucide-react'

export type PaymentMethodType = 'cod' | 'bank_transfer' | 'credit_card'

interface PaymentStepProps {
  paymentMethod: PaymentMethodType
  setPaymentMethod: (method: PaymentMethodType) => void
}

interface PaymentMethodOption {
  value: PaymentMethodType
  label: string
  desc: string
  available: boolean
  icon: React.ReactNode
}

export function PaymentStep({ paymentMethod, setPaymentMethod }: PaymentStepProps) {
  const paymentMethods: PaymentMethodOption[] = [
    {
      value: 'cod',
      label: 'پرداخت هنگام تحویل',
      desc: 'هنگام دریافت سفارش پرداخت کنید',
      available: true,
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      value: 'bank_transfer',
      label: 'انتقال بانکی',
      desc: 'واریز به حساب بانکی ما',
      available: false,
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      value: 'credit_card',
      label: 'کارت اعتباری',
      desc: 'پرداخت امن با کارت اعتباری',
      available: false,
      icon: <CreditCardIcon className="w-5 h-5" />,
    },
  ]

  const handleSelect = (method: PaymentMethodOption) => {
    if (method.available) {
      setPaymentMethod(method.value)
    }
  }

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          روش پرداخت
        </h2>

        <div className="space-y-3">
          {paymentMethods.map((method) => {
            const isSelected = paymentMethod === method.value
            const isAvailable = method.available

            return (
              <div
                key={method.value}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  isAvailable
                    ? isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-base-300 hover:border-primary/40 hover:bg-base-100 cursor-pointer'
                    : 'border-base-300 bg-base-300/30 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => handleSelect(method)}
                role="button"
                tabIndex={isAvailable ? 0 : -1}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(method)}
                aria-disabled={!isAvailable}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="payment-method"
                    className="radio radio-primary"
                    checked={isSelected}
                    onChange={() => handleSelect(method)}
                    disabled={!isAvailable}
                    aria-label={method.label}
                  />
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-content'
                        : isAvailable
                          ? 'bg-base-300 text-base-content/70'
                          : 'bg-base-300/50 text-base-content/40'
                    }`}
                  >
                    {method.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2 flex-wrap">
                      <span>{method.label}</span>
                      {!isAvailable && (
                        <span className="badge badge-warning badge-sm">به زودی</span>
                      )}
                      {isSelected && isAvailable && (
                        <span className="badge badge-success badge-sm gap-1">
                          <Check className="w-3 h-3" />
                          انتخاب شده
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-base-content/60 mt-0.5">{method.desc}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Payment Info Note */}
        <div className="mt-6 p-4 bg-base-100 rounded-xl border border-base-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-info" />
            </div>
            <div>
              <div className="font-medium text-sm">پرداخت امن</div>
              <p className="text-xs text-base-content/60 mt-0.5">
                تمامی تراکنش‌ها با امنیت کامل انجام می‌شود و اطلاعات شما محفوظ است.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
