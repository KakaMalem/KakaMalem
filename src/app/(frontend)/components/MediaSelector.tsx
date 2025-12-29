'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, X, Upload, Layers } from 'lucide-react'
import { MediaLibraryModal } from './MediaLibraryModal'
import type { Media } from '@/payload-types'
import { toast } from 'react-hot-toast'

interface MediaSelectorProps {
  // Single media selection
  value?: string // media ID
  imageUrl?: string | null
  onChange?: (mediaId: string, imageUrl: string) => void
  onRemove?: () => void

  // Customization
  label?: string
  description?: string
  required?: boolean
  shape?: 'square' | 'circle' | 'rectangle'
  aspectRatio?: string // e.g., "aspect-square", "aspect-video"

  // Features
  allowUpload?: boolean
  allowLibrarySelection?: boolean
}

export function MediaSelector({
  value,
  imageUrl,
  onChange,
  onRemove,
  label = 'تصویر',
  description,
  required = false,
  shape = 'square',
  aspectRatio = 'aspect-square',
  allowUpload = true,
  allowLibrarySelection = true,
}: MediaSelectorProps) {
  const [uploading, setUploading] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)

  // Handle direct file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      const mediaId = data.doc?.id
      const mediaUrl = data.doc?.url

      if (!mediaId) {
        throw new Error('No media ID returned from upload')
      }

      onChange?.(mediaId, mediaUrl)
      toast.success('تصویر با موفقیت آپلود شد')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('خطا در آپلود تصویر')
    } finally {
      setUploading(false)
    }
  }

  // Handle library selection
  const handleLibrarySelect = (media: Media | Media[]) => {
    if (Array.isArray(media)) {
      // Should not happen in single mode, but handle gracefully
      if (media.length > 0) {
        const selected = media[0]
        const url = typeof selected.url === 'string' ? selected.url : selected.url || ''
        onChange?.(selected.id, url)
      }
    } else {
      const url = typeof media.url === 'string' ? media.url : media.url || ''
      onChange?.(media.id, url)
    }
    setIsLibraryOpen(false)
  }

  // Handle remove
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'

  return (
    <div className="form-control w-full">
      {/* Label */}
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}

      {/* Description */}
      {description && <p className="text-sm text-base-content/60 mb-3">{description}</p>}

      {/* Preview or Upload Area */}
      <div
        className={`relative w-full ${aspectRatio} ${shapeClass} overflow-hidden bg-base-200 border-2 border-dashed border-base-300 group`}
      >
        {imageUrl ? (
          <>
            {/* Image Preview */}
            <Image
              src={imageUrl}
              alt={label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />

            {/* Hover Overlay with Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {allowLibrarySelection && (
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="btn btn-sm btn-primary"
                  title="انتخاب از آرشیف"
                >
                  <Layers className="w-4 h-4" />
                  آرشیف
                </button>
              )}

              {allowUpload && (
                <label className="btn btn-sm btn-primary" title="آپلود جدید">
                  <Upload className="w-4 h-4" />
                  آپلود
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                    disabled={uploading}
                  />
                </label>
              )}

              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-sm btn-error"
                title="حذف"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Loading Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
              </div>
            )}
          </>
        ) : uploading ? (
          /* Loading Overlay */
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          /* Empty State */
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <ImageIcon className="w-12 h-12 text-base-content/30 mb-2" />
            <p className="text-sm text-base-content/60 mb-3">تصویری انتخاب نشده است</p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {allowLibrarySelection && (
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="btn btn-sm btn-primary"
                >
                  <Layers className="w-4 h-4" />
                  انتخاب از آرشیف
                </button>
              )}

              {allowUpload && (
                <label className="btn btn-sm btn-primary">
                  <Upload className="w-4 h-4" />
                  آپلود جدید
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        multiple={false}
        selectedIds={value ? [value] : []}
        allowUpload={allowUpload}
      />
    </div>
  )
}
