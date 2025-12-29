'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, Search, Upload, CheckCircle } from 'lucide-react'
import type { Media } from '@/payload-types'
import { toast } from 'react-hot-toast'

interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: Media | Media[]) => void
  multiple?: boolean
  selectedIds?: string[]
  allowUpload?: boolean
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  selectedIds = [],
  allowUpload = true,
}: MediaLibraryModalProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>(selectedIds)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalDocs, setTotalDocs] = useState(0)

  // Fetch media from API
  const fetchMedia = useCallback(async (pageNum: number = 1, search: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '24',
        page: String(pageNum),
        sort: '-createdAt',
      })

      if (search) {
        // Build the where clause for search
        const whereClause = {
          filename: {
            contains: search,
          },
        }
        params.append('where', JSON.stringify(whereClause))
      }

      // Use the filtered endpoint to respect storefront boundaries
      const response = await fetch(`/api/media/filtered?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const data = await response.json()

      if (pageNum === 1) {
        setMedia(data.docs || [])
      } else {
        setMedia((prev) => [...prev, ...(data.docs || [])])
      }

      setHasMore(data.hasNextPage || false)
      setTotalDocs(data.totalDocs || 0)
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Failed to load media library')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load and search
  useEffect(() => {
    if (isOpen) {
      setPage(1)
      fetchMedia(1, searchQuery)
    }
  }, [isOpen, searchQuery, fetchMedia])

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedMedia: Media[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
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
        if (data.doc) {
          uploadedMedia.push(data.doc)
        }
      }

      // Refresh media list
      await fetchMedia(1, searchQuery)

      // Auto-select uploaded media
      if (multiple) {
        const newIds = uploadedMedia.map((m) => m.id)
        setSelectedMediaIds((prev) => [...prev, ...newIds])
      } else if (uploadedMedia.length > 0) {
        setSelectedMediaIds([uploadedMedia[0].id])
      }

      toast.success(`Uploaded ${uploadedMedia.length} file(s)`)
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  // Toggle selection
  const toggleSelection = (mediaId: string) => {
    if (multiple) {
      setSelectedMediaIds((prev) =>
        prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId],
      )
    } else {
      setSelectedMediaIds([mediaId])
    }
  }

  // Handle selection confirmation
  const handleConfirmSelection = () => {
    const selectedMedia = media.filter((m) => selectedMediaIds.includes(m.id))
    if (selectedMedia.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    onSelect(multiple ? selectedMedia : selectedMedia[0])
    onClose()
  }

  // Load more media
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchMedia(nextPage, searchQuery)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-[91] w-full max-w-5xl max-h-[90vh] bg-base-100 rounded-lg shadow-xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-base-content">آرشیف عکس</h2>
            <p className="text-sm text-base-content/60 mt-1">
              {totalDocs} {totalDocs === 1 ? 'فایل' : 'فایل'} موجود
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Upload */}
        <div className="p-4 border-b border-base-300 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام فایل..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Upload Button */}
          {allowUpload && (
            <label className="btn btn-primary">
              <Upload className="w-5 h-5" />
              آپلود
              <input
                type="file"
                multiple={multiple}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && page === 1 ? (
            <div className="flex justify-center items-center h-64">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-base-content/60">
              <p className="text-lg font-medium">عکسی یافت نشد</p>
              {allowUpload && <p className="text-sm mt-2">اولین تصویر خود را آپلود کنید</p>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {media
                  .filter((item) => !selectedIds.includes(item.id))
                  .map((item) => {
                    const isSelected = selectedMediaIds.includes(item.id)
                    const imageUrl =
                      typeof item.url === 'string' ? item.url : item.url || '/placeholder.svg'

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelection(item.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                          isSelected
                            ? 'ring-4 ring-primary shadow-lg'
                            : 'ring-1 ring-base-300 hover:ring-2 hover:ring-primary/50'
                        }`}
                      >
                        <Image
                          src={imageUrl}
                          alt={item.alt || item.filename || 'Media'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                        />

                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-primary drop-shadow-lg fill-primary" />
                          </div>
                        )}

                        {/* Filename tooltip */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                          {item.filename || 'Untitled'}
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="btn btn-outline btn-primary"
                  >
                    {loading ? (
                      <>
                        <span className="loading loading-spinner loading-sm" />
                        در حال بارگذاری...
                      </>
                    ) : (
                      'بیشتر بارگذاری کنید'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 flex items-center justify-between">
          <div className="text-sm text-base-content/60">
            {selectedMediaIds.length > 0 && (
              <span>
                {selectedMediaIds.length} {selectedMediaIds.length === 1 ? 'فایل' : 'فایل'} انتخاب
                شده
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost">
              لغو
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={selectedMediaIds.length === 0}
              className="btn btn-primary"
            >
              انتخاب {selectedMediaIds.length > 0 && `(${selectedMediaIds.length})`}
            </button>
          </div>
        </div>

        {/* Upload Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="bg-base-100 p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
              <span className="loading loading-spinner loading-lg text-primary" />
              <p className="text-base-content font-medium">در حال آپلود فایل‌ها...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
