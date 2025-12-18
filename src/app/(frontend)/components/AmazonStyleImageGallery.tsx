'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { PLACEHOLDER_IMAGE } from '@/utilities/ui'

interface AmazonStyleImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export const AmazonStyleImageGallery: React.FC<AmazonStyleImageGalleryProps> = ({
  images,
  productName,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set())
  const imageRef = useRef<HTMLDivElement>(null)
  const zoomLensRef = useRef<HTMLDivElement>(null)

  const currentImage = images[selectedIndex] || PLACEHOLDER_IMAGE

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setZoomPosition({ x, y })

    // Position the zoom lens
    if (zoomLensRef.current) {
      const lensX = e.clientX - rect.left - 50 // 50 is half of lens width
      const lensY = e.clientY - rect.top - 50 // 50 is half of lens height
      zoomLensRef.current.style.left = `${lensX}px`
      zoomLensRef.current.style.top = `${lensY}px`
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsZooming(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false)
  }, [])

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index)
    setIsZooming(false)
  }, [])

  const handleImageError = useCallback((index: number) => {
    setImageLoadError((prev) => new Set(prev).add(index))
  }, [])

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* Left Sidebar: Vertical Thumbnails */}
      <div className="flex flex-col gap-2 w-16 md:w-20">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => handleThumbnailClick(index)}
            onMouseEnter={() => handleThumbnailClick(index)}
            className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary ${
              selectedIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-base-300'
            }`}
            aria-label={`View image ${index + 1}`}
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
                sizes="80px"
                quality={60}
                onError={() => handleImageError(index)}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Image Container */}
      <div className="flex-1 relative">
        <div
          ref={imageRef}
          className="relative w-full aspect-square bg-base-100 rounded-lg border border-base-300 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {imageLoadError.has(selectedIndex) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-base-content/40">
              <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <>
              <Image
                src={currentImage}
                alt={`${productName} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain p-8"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                priority={selectedIndex === 0}
                quality={90}
                onError={() => handleImageError(selectedIndex)}
              />

              {/* Zoom Lens - visible on hover */}
              {isZooming && (
                <div
                  ref={zoomLensRef}
                  className="absolute w-32 h-32 border-2 border-primary/50 bg-white/10 backdrop-blur-[2px] pointer-events-none shadow-lg"
                  style={{
                    display: 'block',
                  }}
                />
              )}

              {/* Hover hint */}
              {!isZooming && (
                <div className="absolute bottom-4 right-4 bg-base-100/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
                  Hover to zoom
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Zoomed View Overlay - Only appears on hover (like Amazon) */}
        {isZooming && !imageLoadError.has(selectedIndex) && (
          <div
            className="hidden lg:block absolute left-full ml-4 top-0 w-[500px] h-[500px] bg-base-100 rounded-lg border-2 border-base-300 shadow-2xl overflow-hidden z-50"
            style={{
              backgroundImage: `url(${currentImage})`,
              backgroundSize: '250%',
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>
    </div>
  )
}
