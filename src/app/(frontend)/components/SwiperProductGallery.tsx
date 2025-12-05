'use client'

import React, { useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Navigation, Thumbs, Zoom } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import Image from 'next/image'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import 'swiper/css/zoom'

interface SwiperProductGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export const SwiperProductGallery: React.FC<SwiperProductGalleryProps> = ({
  images,
  productName,
  className = '',
}) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set())

  const handleImageError = (index: number) => {
    setImageLoadError((prev) => new Set(prev).add(index))
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Main Swiper */}
      <Swiper
        style={
          {
            '--swiper-navigation-color': '#fff',
            '--swiper-pagination-color': '#fff',
          } as React.CSSProperties
        }
        spaceBetween={10}
        navigation={true}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        zoom={true}
        modules={[FreeMode, Navigation, Thumbs, Zoom]}
        className="rounded-lg mb-4 aspect-square bg-base-100 border border-base-300"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="swiper-zoom-container">
              {imageLoadError.has(index) ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/40">
                  <svg
                    className="w-20 h-20 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">Image unavailable</p>
                </div>
              ) : (
                <Image
                  src={image}
                  alt={`${productName} - Image ${index + 1}`}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  priority={index === 0}
                  quality={90}
                  onError={() => handleImageError(index)}
                />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnail Swiper */}
      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          modules={[FreeMode, Navigation, Thumbs]}
          className="thumbs-swiper"
          breakpoints={{
            640: {
              slidesPerView: 5,
            },
            768: {
              slidesPerView: 6,
            },
            1024: {
              slidesPerView: 7,
            },
          }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-base-300 cursor-pointer hover:border-primary transition-colors">
                {imageLoadError.has(index) ? (
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-base-content/20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                ) : (
                  <Image
                    src={image}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                    quality={60}
                    onError={() => handleImageError(index)}
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Zoom Hint */}
      <div className="mt-4 text-center">
        <p className="text-sm text-base-content/60">
          💡 <span className="font-medium">Desktop:</span> Double-click to zoom |{' '}
          <span className="font-medium">Mobile:</span> Pinch to zoom
        </p>
      </div>
    </div>
  )
}
