'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Thumbs, Keyboard, Navigation } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import Image from 'next/image'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'

interface HybridProductGalleryProps {
  images: string[]
  productName: string
  className?: string
}

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'

export const HybridProductGallery: React.FC<HybridProductGalleryProps> = ({
  images,
  productName,
  className = '',
}) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set())
  const [activeIndex, setActiveIndex] = useState(0)

  // Amazon-style hover zoom states
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleImageError = (index: number) => {
    setImageLoadError((prev) => new Set(prev).add(index))
  }

  const currentImage = images[activeIndex] || PLACEHOLDER_IMAGE

  // Amazon-style hover zoom handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const relativeY = e.clientY - rect.top

    // Add inward margin so zoom reaches edges before cursor does
    // This means hovering 75% across will show 100% of the image
    const margin = rect.width * 0.25 // 25% margin on each side
    const marginY = rect.height * 0.25

    // Adjust position to compress the active area
    const adjustedX = relativeX - margin
    const adjustedY = relativeY - marginY
    const activeWidth = rect.width - margin * 2
    const activeHeight = rect.height - marginY * 2

    // Calculate percentage - will reach 100% before cursor reaches edge
    let x = (adjustedX / activeWidth) * 100
    let y = (adjustedY / activeHeight) * 100

    // Clamp to 0-100 range
    x = Math.max(0, Math.min(100, x))
    y = Math.max(0, Math.min(100, y))

    setZoomPosition({ x, y })
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsZooming(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false)
  }, [])

  // Handle thumbnail click to change main image
  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (mainSwiper) {
        mainSwiper.slideTo(index)
      }
    },
    [mainSwiper],
  )

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Main Swiper - with Amazon-style hover zoom */}
      <div className="relative">
        <div
          ref={imageRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
        >
          <Swiper
            onSwiper={setMainSwiper}
            style={
              {
                '--swiper-navigation-color': '#fff',
                '--swiper-pagination-color': '#fff',
              } as React.CSSProperties
            }
            spaceBetween={10}
            navigation={false}
            keyboard={{
              enabled: true,
            }}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            modules={[FreeMode, Navigation, Thumbs, Keyboard]}
            className="rounded-lg mb-3 sm:mb-4 aspect-square bg-base-100 border border-base-300"
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="relative w-full h-full">
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
                      className="object-contain"
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

          {/* Hover hint */}
          {!isZooming && (
            <div className="hidden lg:block absolute bottom-8 right-8 bg-base-100/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-lg z-10">
              Hover to zoom
            </div>
          )}
        </div>

        {/* Floating Zoomed View Overlay - Only appears on hover (like Amazon) - Desktop only */}
        {isZooming && !imageLoadError.has(activeIndex) && (
          <div
            className="hidden lg:block absolute left-full ml-4 top-0 w-[600px] h-[600px] xl:w-[700px] xl:h-[700px] bg-base-100 rounded-lg border-2 border-base-300 shadow-2xl overflow-hidden z-50"
            style={{
              backgroundImage: `url(${currentImage})`,
              backgroundSize: '250%',
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>

      {/* Thumbnail Swiper - Small images for selecting */}
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
              <div
                onClick={() => handleThumbnailClick(index)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 ${
                  activeIndex === index
                    ? 'border-primary ring-2 ring-primary/30 scale-95'
                    : 'border-base-300 hover:border-primary hover:shadow-md'
                }`}
              >
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
    </div>
  )
}
