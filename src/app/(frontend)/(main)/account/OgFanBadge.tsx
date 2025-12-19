'use client'

import React, { useState } from 'react'
import { Crown, Sparkles, X } from 'lucide-react'

interface OgFanBadgeProps {
  variant: 'banner' | 'badge' | 'avatar-crown' | 'vip-tag'
  children?: React.ReactNode
}

export default function OgFanBadge({ variant, children }: OgFanBadgeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const renderContent = () => {
    switch (variant) {
      case 'banner':
        return (
          <button
            onClick={handleClick}
            className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-1.5 rounded-b-xl shadow-lg flex items-center gap-2 hover:from-amber-500 hover:to-yellow-500 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4" />
            <span className="text-sm font-bold">هوادار اصلی</span>
            <Sparkles className="w-4 h-4" />
          </button>
        )
      case 'badge':
        return (
          <button
            onClick={handleClick}
            className="badge badge-sm bg-gradient-to-r from-amber-600 to-yellow-500 border-amber-400 text-white gap-1 shadow-md hover:from-amber-500 hover:to-yellow-400 transition-all cursor-pointer"
          >
            <Crown className="w-3 h-3" />
            هوادار اصلی
          </button>
        )
      case 'avatar-crown':
        return (
          <button
            onClick={handleClick}
            className="absolute -bottom-1 -right-1 md:bottom-0 md:right-0 w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:from-yellow-300 hover:to-amber-400 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </button>
        )
      case 'vip-tag':
        return (
          <button
            onClick={handleClick}
            className="hidden md:flex items-center gap-1 bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 hover:bg-white/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-800" />
            <span className="text-sm font-semibold text-amber-900">VIP</span>
          </button>
        )
      default:
        return children
    }
  }

  return (
    <>
      {renderContent()}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Golden header */}
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 p-6 text-center relative overflow-hidden">
              {/* Sparkles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-2 left-[20%] w-2 h-2 bg-white rounded-full animate-pulse opacity-60"></div>
                <div
                  className="absolute top-4 left-[50%] w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-40"
                  style={{ animationDelay: '0.5s' }}
                ></div>
                <div
                  className="absolute top-3 left-[80%] w-1 h-1 bg-white rounded-full animate-pulse opacity-50"
                  style={{ animationDelay: '1s' }}
                ></div>
              </div>

              {/* Crown icon */}
              <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 ring-4 ring-white/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">هوادار اصلی</h3>
              <p className="text-amber-100 mt-1">Original Fan</p>

              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-amber-900 text-center mb-6 leading-relaxed">
                شما یکی از اولین حامیان کاکا معلم هستید! این نشان ویژه به پاس قدردانی از حمایت
                ارزشمند شما در روزهای اول راه‌اندازی فروشگاه اهدا شده است.
              </p>

              {/* Footer message */}
              <div className="mt-6 pt-4 border-t border-amber-200 text-center">
                <p className="text-sm text-amber-600">از اینکه همراه ما هستید سپاسگزاریم! 💛</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
