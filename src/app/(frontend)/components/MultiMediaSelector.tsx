'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, X, Upload, Layers, GripVertical } from 'lucide-react'
import { MediaLibraryModal } from './MediaLibraryModal'
import type { Media } from '@/payload-types'
import { toast } from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface MediaItem {
  id: string
  url: string
}

interface MultiMediaSelectorProps {
  value: MediaItem[] // Array of {id, url}
  onChange: (items: MediaItem[]) => void

  // Customization
  label?: string
  description?: string
  required?: boolean
  maxItems?: number

  // Features
  allowUpload?: boolean
  allowLibrarySelection?: boolean
  allowReorder?: boolean
}

interface SortableImageProps {
  item: MediaItem
  onRemove: (id: string) => void
}

function SortableImage({ item, onRemove }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative aspect-square rounded-lg overflow-hidden bg-base-200 border-2 border-base-300 group"
    >
      {/* Image */}
      <Image
        src={item.url}
        alt="Product image"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 200px"
      />

      {/* Drag Handle - always visible on mobile, hover on desktop */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing bg-black/50 hover:bg-black/70 rounded p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-5 h-5 text-white" />
      </div>

      {/* Remove Button - always visible on mobile, hover on desktop */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(item.id)
        }}
        className="absolute top-2 right-2 btn btn-sm btn-circle btn-error opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Drag Indicator Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/20 border-2 border-primary border-dashed" />
      )}
    </div>
  )
}

export function MultiMediaSelector({
  value,
  onChange,
  label = 'تصاویر',
  description,
  required = false,
  maxItems = 10,
  allowUpload = true,
  allowLibrarySelection = true,
}: MultiMediaSelectorProps) {
  const [uploading, setUploading] = useState(false)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((item) => item.id === active.id)
      const newIndex = value.findIndex((item) => item.id === over.id)

      onChange(arrayMove(value, oldIndex, newIndex))
    }
  }

  // Handle direct file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remainingSlots = maxItems - value.length
    if (remainingSlots <= 0) {
      toast.error(`حداکثر ${maxItems} تصویر مجاز است`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    const uploadedItems: MediaItem[] = []

    try {
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/media', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        const mediaId = data.doc?.id
        const mediaUrl = data.doc?.url

        if (mediaId && mediaUrl) {
          uploadedItems.push({ id: mediaId, url: mediaUrl })
        }
      }

      onChange([...value, ...uploadedItems])
      toast.success(`${uploadedItems.length} تصویر آپلود شد`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('خطا در آپلود برخی تصاویر')
    } finally {
      setUploading(false)
    }
  }

  // Handle library selection
  const handleLibrarySelect = (media: Media | Media[]) => {
    const mediaArray = Array.isArray(media) ? media : [media]

    const remainingSlots = maxItems - value.length
    if (remainingSlots <= 0) {
      toast.error(`حداکثر ${maxItems} تصویر مجاز است`)
      return
    }

    const itemsToAdd = mediaArray.slice(0, remainingSlots).map((m) => ({
      id: m.id,
      url: typeof m.url === 'string' ? m.url : m.url || '',
    }))

    // Filter out duplicates
    const existingIds = new Set(value.map((item) => item.id))
    const newItems = itemsToAdd.filter((item) => !existingIds.has(item.id))

    if (newItems.length === 0) {
      toast.error('تصاویر انتخاب شده قبلاً اضافه شده‌اند')
      return
    }

    onChange([...value, ...newItems])
    setIsLibraryOpen(false)
  }

  // Handle remove
  const handleRemove = (id: string) => {
    onChange(value.filter((item) => item.id !== id))
  }

  const canAddMore = value.length < maxItems

  return (
    <div className="form-control w-full">
      {/* Label */}
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
          <span className="label-text-alt text-base-content/60">
            {value.length} / {maxItems}
          </span>
        </label>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-base-content/60 mb-3 break-words w-full">{description}</p>
      )}

      {/* Images Grid */}
      {value.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={value.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
              {value.map((item) => (
                <SortableImage key={item.id} item={item} onRemove={handleRemove} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add More Section - only show when there are already images */}
      {canAddMore && value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allowLibrarySelection && (
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              disabled={uploading}
              className="btn btn-outline btn-primary"
            >
              <Layers className="w-5 h-5" />
              انتخاب از آرشیف
            </button>
          )}

          {allowUpload && (
            <label className="btn btn-outline btn-primary">
              <Upload className="w-5 h-5" />
              آپلود تصاویر
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
          )}

          {uploading && (
            <div className="flex items-center gap-2 text-base-content/60">
              <span className="loading loading-spinner loading-sm text-primary" />
              <span className="text-sm">در حال آپلود...</span>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !uploading && (
        <div className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center bg-base-200">
          <ImageIcon className="w-12 h-12 text-base-content/30 mx-auto mb-3" />
          <p className="text-sm text-base-content/60 mb-4">هنوز تصویری اضافه نشده است</p>
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
                آپلود تصاویر
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        multiple={true}
        selectedIds={value.map((item) => item.id)}
        allowUpload={allowUpload}
      />
    </div>
  )
}
