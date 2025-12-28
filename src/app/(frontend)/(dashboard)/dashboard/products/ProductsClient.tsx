'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Package, Edit, Eye, GripVertical, Loader2, RefreshCw } from 'lucide-react'
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
import { getProductImageUrl } from '@/utilities/ui'
import type { Product, Storefront } from '@/payload-types'

interface ProductsClientProps {
  initialProducts: Product[]
  storefront: Storefront | null
}

interface SortableProductItemProps {
  product: Product
  storefront: Storefront | null
  statusLabels: Record<string, { label: string; class: string }>
  stockStatusLabels: Record<string, { label: string; class: string }>
}

const statusLabels: Record<string, { label: string; class: string }> = {
  draft: { label: 'پیش‌نویس', class: 'badge-warning' },
  published: { label: 'منتشر شده', class: 'badge-success' },
}

const stockStatusLabels: Record<string, { label: string; class: string }> = {
  in_stock: { label: 'موجود', class: 'badge-success' },
  low_stock: { label: 'کم', class: 'badge-warning' },
  out_of_stock: { label: 'ناموجود', class: 'badge-error' },
  backorder: { label: 'پیش‌سفارش', class: 'badge-info' },
}

// Product item content (shared between sortable and overlay)
function ProductItemContent({
  product,
  storefront,
  isDragging = false,
  dragHandleProps,
}: {
  product: Product
  storefront: Storefront | null
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const imageUrl = getProductImageUrl(product)
  const status = statusLabels[product._status || 'draft']
  const stockStatus = stockStatusLabels[product.stockStatus || 'in_stock']

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

      {/* Product Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-base-300 flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-base-content/30" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{product.name}</p>
          {product.hasVariants && <p className="text-xs text-base-content/60">دارای تنوع</p>}
        </div>
      </div>

      {/* Price */}
      <div className="hidden sm:block w-28 flex-shrink-0 text-left">
        {product.salePrice && product.salePrice < product.price ? (
          <div className="flex flex-col">
            <span className="font-medium text-success">{product.salePrice.toLocaleString()} ؋</span>
            <span className="text-xs text-base-content/50 line-through">
              {product.price.toLocaleString()}
            </span>
          </div>
        ) : (
          <span className="font-medium">{product.price?.toLocaleString()} ؋</span>
        )}
      </div>

      {/* Inventory */}
      <div className="hidden md:block w-16 text-center flex-shrink-0">
        {product.trackQuantity ? (
          <span className="font-mono text-sm">{product.quantity || 0}</span>
        ) : (
          <span className="text-base-content/50">-</span>
        )}
      </div>

      {/* Status */}
      <div className="hidden sm:flex flex-col gap-1 w-20 flex-shrink-0">
        <span className={`badge badge-sm ${status.class}`}>{status.label}</span>
        <span className={`badge badge-sm ${stockStatus.class}`}>{stockStatus.label}</span>
      </div>

      {/* Sales */}
      <div className="w-12 text-center flex-shrink-0">
        <span className="font-mono text-sm">{product.totalSold || 0}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          href={`/dashboard/products/${product.id}`}
          className="btn btn-ghost btn-sm btn-square"
          title="ویرایش"
        >
          <Edit className="w-4 h-4" />
        </Link>
        <Link
          href={
            storefront
              ? `/store/${storefront.slug}/product/${product.slug}`
              : `/product/${product.slug}`
          }
          className="btn btn-ghost btn-sm btn-square hidden sm:flex"
          target="_blank"
          title="مشاهده"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

function SortableProductItem({ product, storefront }: SortableProductItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ProductItemContent
        product={product}
        storefront={storefront}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

export default function ProductsClient({ initialProducts, storefront }: ProductsClientProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeProduct = activeId ? products.find((p) => p.id === activeId) : null

  // Update products when initialProducts changes (e.g., after router.refresh())
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    router.refresh()
    // Give the router time to refresh
    setTimeout(() => setIsRefreshing(false), 1000)
  }

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

    const oldIndex = products.findIndex((p) => p.id === active.id)
    const newIndex = products.findIndex((p) => p.id === over.id)

    const newProducts = arrayMove(products, oldIndex, newIndex)
    setProducts(newProducts)

    // Save the new order to the server
    setIsSaving(true)
    try {
      const updates = newProducts.map((prod, index) => ({
        id: prod.id,
        displayOrder: index,
      }))

      const res = await fetch('/api/reorder-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ products: updates }),
      })

      if (!res.ok) {
        throw new Error('Failed to save order')
      }

      toast.success('ترتیب محصولات ذخیره شد')
    } catch (error) {
      // Revert to original order on error
      setProducts(initialProducts)
      toast.error('خطا در ذخیره ترتیب محصولات')
      console.error('Error saving product order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">محصولات</h1>
          <p className="text-base-content/60 mt-1">
            مدیریت محصولات فروشگاه شما ({products.length} محصول)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-sm text-base-content/60 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال ذخیره...
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost btn-sm gap-2"
            title="بروزرسانی لیست"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
          <Link href="/dashboard/products/new" className="btn btn-primary gap-2">
            <Plus className="w-5 h-5" />
            افزودن محصول
          </Link>
        </div>
      </div>

      {/* Products List */}
      {products.length > 0 ? (
        <div className="card bg-base-200">
          <div className="card-body p-4">
            {/* Header row */}
            <div className="flex items-center gap-2 sm:gap-4 px-3 py-2 text-sm font-medium text-base-content/60">
              <div className="w-9 sm:w-11 flex-shrink-0"></div>
              <div className="flex-1">محصول</div>
              <div className="hidden sm:block w-28 flex-shrink-0 text-left">قیمت</div>
              <div className="hidden md:block w-16 text-center flex-shrink-0">موجودی</div>
              <div className="hidden sm:block w-20 flex-shrink-0">وضعیت</div>
              <div className="w-12 text-center flex-shrink-0">فروش</div>
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
                items={products.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {products.map((product) => (
                    <SortableProductItem
                      key={product.id}
                      product={product}
                      storefront={storefront}
                      statusLabels={statusLabels}
                      stockStatusLabels={stockStatusLabels}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeProduct ? (
                  <ProductItemContent product={activeProduct} storefront={storefront} isDragging />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      ) : (
        <div className="card bg-base-200">
          <div className="card-body items-center text-center py-16">
            <Package className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-xl font-bold">هنوز محصولی ندارید</h3>
            <p className="text-base-content/60 max-w-md">
              اولین محصول خود را اضافه کنید تا مشتریان بتوانند از فروشگاه شما خرید کنند.
            </p>
            <Link href="/dashboard/products/new" className="btn btn-primary mt-4 gap-2">
              <Plus className="w-5 h-5" />
              افزودن اولین محصول
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
