'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productName,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [imageLoadError, setImageLoadError] = useState<Set<number>>(new Set())

  const hasMultipleImages = images.length > 1
  const currentImage = images[selectedIndex] || '/placeholder.jpg'

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const handleImageError = useCallback((index: number) => {
    setImageLoadError((prev) => new Set(prev).add(index))
  }, [])

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true)
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'
  }, [])

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false)
    document.body.style.overflow = 'unset'
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') closeLightbox()
        if (e.key === 'ArrowLeft') handlePrevious()
        if (e.key === 'ArrowRight') handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, handlePrevious, handleNext, closeLightbox])

  return (
    <>
      {/* Main Gallery */}
      <div className={`flex flex-col gap-4 ${className}`}>
        {/* Main Image Display */}
        <div className="relative aspect-square w-full bg-base-200 rounded-2xl overflow-hidden group">
          {imageLoadError.has(selectedIndex) ? (
            // Error state
            <div className="absolute inset-0 flex flex-col items-center justify-center text-base-content/40">
              <div className="w-24 h-24 mb-4 rounded-full bg-base-300 flex items-center justify-center">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium">Image unavailable</p>
            </div>
          ) : (
            <>
              <Image
                src={currentImage}
                alt={`${productName} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain p-4"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                priority={selectedIndex === 0}
                quality={90}
                onError={() => handleImageError(selectedIndex)}
              />

              {/* Zoom Button Overlay */}
              <button
                onClick={openLightbox}
                className="absolute top-4 right-4 btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="View fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Navigation Arrows (only if multiple images) */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-base-100/80 hover:bg-base-100 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-base-100/80 backdrop-blur-sm rounded-full text-xs font-medium">
                  {selectedIndex + 1} / {images.length}
                </div>
              )}
            </>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-base-200">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-base-300 hover:border-base-content/30'
                }`}
                aria-label={`View image ${index + 1}`}
              >
                {imageLoadError.has(index) ? (
                  <div className="w-full h-full bg-base-200 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-base-content/20"
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
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/10"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          {hasMultipleImages && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Main Lightbox Image */}
          <div className="relative w-full h-full max-w-7xl max-h-screen p-4 md:p-8">
            {imageLoadError.has(selectedIndex) ? (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <p>Image unavailable</p>
              </div>
            ) : (
              <Image
                src={currentImage}
                alt={`${productName} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={95}
                priority
                onError={() => handleImageError(selectedIndex)}
              />
            )}
          </div>

          {/* Navigation */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-lg bg-white/10 hover:bg-white/20 border-none text-white"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-lg bg-white/10 hover:bg-white/20 border-none text-white"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Thumbnail Strip */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-full px-4">
              <div className="flex gap-2 overflow-x-auto pb-2 max-w-[90vw] scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIndex === index
                        ? 'border-white ring-2 ring-white/50'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    {imageLoadError.has(index) ? (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white/40"
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
                        sizes="64px"
                        quality={50}
                        onError={() => handleImageError(index)}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
