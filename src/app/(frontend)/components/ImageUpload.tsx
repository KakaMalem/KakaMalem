'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  /** Current image URL */
  imageUrl: string | null
  /** Called when image is uploaded, returns the media ID */
  onUpload: (mediaId: string, imageUrl: string) => void
  /** Called when image is removed */
  onRemove?: () => void
  /** Alt text for the image */
  alt?: string
  /** Label for the upload button */
  uploadLabel?: string
  /** Label for the change button */
  changeLabel?: string
  /** Label for the remove button */
  removeLabel?: string
  /** Description text below the upload area */
  description?: string
  /** Image shape - 'circle' or 'square' */
  shape?: 'circle' | 'square'
  /** Size of the image preview */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show the remove button */
  showRemove?: boolean
  /** Custom class for the container */
  className?: string
  /** Max file size in MB */
  maxSizeMB?: number
  /** Recommended dimensions text */
  recommendedSize?: string
}

export default function ImageUpload({
  imageUrl,
  onUpload,
  onRemove,
  alt = 'تصویر',
  uploadLabel = 'آپلود تصویر',
  changeLabel = 'تغییر تصویر',
  removeLabel = 'حذف',
  description = 'فرمت‌های مجاز: JPG، PNG، GIF',
  shape = 'square',
  size = 'md',
  showRemove = true,
  className = '',
  maxSizeMB = 5,
  recommendedSize,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً یک فایل تصویر انتخاب کنید')
      return
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`حجم تصویر نباید بیشتر از ${maxSizeMB} مگابایت باشد`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('alt', alt)

      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('آپلود تصویر ناموفق بود')
      }

      const data = await response.json()
      const mediaId = data.doc?.id
      const mediaUrl = data.doc?.url

      if (!mediaId) {
        throw new Error('آپلود تصویر ناموفق بود')
      }

      onUpload(mediaId, mediaUrl)
      toast.success('تصویر با موفقیت آپلود شد')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'آپلود تصویر ناموفق بود')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove()
      toast.success('تصویر حذف شد')
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-4 ${className}`}>
      {/* Image Preview */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} ${
            shape === 'circle' ? 'rounded-full' : 'rounded-xl'
          } overflow-hidden bg-base-200 border-2 border-base-300 flex items-center justify-center`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              width={160}
              height={160}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-10 h-10 text-base-content/30" />
          )}
        </div>
        {isUploading && (
          <div
            className={`absolute inset-0 bg-base-100/80 ${
              shape === 'circle' ? 'rounded-full' : 'rounded-xl'
            } flex items-center justify-center`}
          >
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex-1 text-center sm:text-right space-y-2">
        <div>
          {recommendedSize && (
            <p className="text-sm text-base-content/80 mb-1">{recommendedSize}</p>
          )}
          <p className="text-xs text-base-content/60">
            {description} - حداکثر {maxSizeMB} مگابایت
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id={`image-upload-${Math.random().toString(36).slice(2)}`}
          />
          <label
            htmlFor={fileInputRef.current?.id || ''}
            onClick={() => fileInputRef.current?.click()}
            className={`btn btn-primary btn-sm gap-2 ${isUploading ? 'btn-disabled' : 'cursor-pointer'}`}
          >
            <Camera className="w-4 h-4" />
            {imageUrl ? changeLabel : uploadLabel}
          </label>

          {showRemove && imageUrl && onRemove && (
            <button
              type="button"
              onClick={handleRemove}
              className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4" />
              {removeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
