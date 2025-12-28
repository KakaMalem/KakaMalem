'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, FolderTree, Edit, Eye, GripVertical, Loader2 } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import type { Category, Media } from '@/payload-types'

interface CategoriesClientProps {
  initialCategories: Category[]
  productCounts: Record<string, number>
  storefrontSlug: string | null
}

interface SortableCategoryItemProps {
  category: Category
  productCount: number
  storefrontSlug: string | null
}

// Helper to get image URL
const getCategoryImageUrl = (category: Category): string | null => {
  if (!category.smallCategoryImage) return null
  if (typeof category.smallCategoryImage === 'object' && category.smallCategoryImage !== null) {
    return (category.smallCategoryImage as Media).url || null
  }
  return null
}

// Category item content (shared between sortable and overlay)
function CategoryItemContent({
  category,
  productCount,
  storefrontSlug,
  isDragging = false,
  dragHandleProps,
}: {
  category: Category
  productCount: number
  storefrontSlug: string | null
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const imageUrl = getCategoryImageUrl(category)

  return (
    <div
      className={`flex items-center gap-2 sm:gap-4 p-3 bg-base-100 rounded-lg border border-base-300 ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : 'hover:bg-base-200'
      }`}
    >
      {/* Drag Handle */}
      <button
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing p-1 sm:p-2 hover:bg-base-300 rounded-lg transition-colors touch-none flex-shrink-0"
        title="بکشید و رها کنید برای تغییر ترتیب"
      >
        <GripVertical className="w-5 h-5 text-base-content/50" />
      </button>

      {/* Category Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-base-300 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={category.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-base-content/30" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{category.name}</p>
          {category.description && (
            <p className="text-xs text-base-content/60 truncate">{category.description}</p>
          )}
        </div>
      </div>

      {/* Product Count */}
      <div className="w-12 text-center flex-shrink-0">
        <span className="font-mono text-sm">{productCount}</span>
      </div>

      {/* Visibility */}
      <div className="hidden sm:block w-16 flex-shrink-0">
        <span
          className={`badge badge-sm ${category.showInMenu ? 'badge-success' : 'badge-warning'}`}
        >
          {category.showInMenu ? 'نمایش' : 'پنهان'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          href={`/dashboard/categories/${category.id}`}
          className="btn btn-ghost btn-sm btn-square"
          title="ویرایش"
        >
          <Edit className="w-4 h-4" />
        </Link>
        {storefrontSlug && (
          <Link
            href={`/store/${storefrontSlug}/category/${category.slug}`}
            className="btn btn-ghost btn-sm btn-square hidden sm:flex"
            target="_blank"
            title="مشاهده"
          >
            <Eye className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

function SortableCategoryItem({
  category,
  productCount,
  storefrontSlug,
}: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <CategoryItemContent
        category={category}
        productCount={productCount}
        storefrontSlug={storefrontSlug}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default function CategoriesClient({
  initialCategories,
  productCounts,
  storefrontSlug,
}: CategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isSaving, setIsSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeCategory = activeId ? categories.find((c) => c.id === activeId) : null

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)

    const newCategories = arrayMove(categories, oldIndex, newIndex)
    setCategories(newCategories)

    // Save the new order to the server
    setIsSaving(true)
    try {
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        displayOrder: index,
      }))

      const res = await fetch('/api/reorder-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ categories: updates }),
      })

      if (!res.ok) {
        throw new Error('Failed to save order')
      }

      toast.success('ترتیب دسته‌بندی‌ها ذخیره شد')
    } catch (error) {
      // Revert to original order on error
      setCategories(initialCategories)
      toast.error('خطا در ذخیره ترتیب دسته‌بندی‌ها')
      console.error('Error saving category order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">دسته‌بندی‌ها</h1>
          <p className="text-base-content/60 mt-1">
            مدیریت دسته‌بندی‌های فروشگاه شما ({categories.length} دسته)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-sm text-base-content/60 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال ذخیره...
            </span>
          )}
          <Link href="/dashboard/categories/new" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            افزودن دسته‌بندی
          </Link>
        </div>
      </div>

      {/* Categories List */}
      {categories.length > 0 ? (
        <div className="card bg-base-200">
          <div className="card-body p-4">
            {/* Header row */}
            <div className="flex items-center gap-2 sm:gap-4 px-3 py-2 text-sm font-medium text-base-content/60">
              <div className="w-9 sm:w-11 flex-shrink-0"></div>
              <div className="flex-1">دسته‌بندی</div>
              <div className="w-12 text-center flex-shrink-0">محصولات</div>
              <div className="hidden sm:block w-16 flex-shrink-0">نمایش</div>
              <div className="w-16 sm:w-20 flex-shrink-0"></div>
            </div>

            {/* Sortable list */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {categories.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      productCount={productCounts[category.id] || 0}
                      storefrontSlug={storefrontSlug}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeCategory ? (
                  <CategoryItemContent
                    category={activeCategory}
                    productCount={productCounts[activeCategory.id] || 0}
                    storefrontSlug={storefrontSlug}
                    isDragging
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-16">
            <FolderTree className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-xl font-bold">هنوز دسته‌بندی ندارید</h3>
            <p className="text-base-content/60 max-w-md">
              دسته‌بندی‌ها به مشتریان کمک می‌کنند محصولات شما را راحت‌تر پیدا کنند.
            </p>
            <Link href="/dashboard/categories/new" className="btn btn-primary mt-4 gap-2">
              <Plus className="w-5 h-5" />
              افزودن اولین دسته‌بندی
            </Link>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="font-bold mb-2">راهنمای دسته‌بندی</h3>
          <ul className="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>برای تغییر ترتیب نمایش، دسته‌بندی را بکشید و در محل مورد نظر رها کنید</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
