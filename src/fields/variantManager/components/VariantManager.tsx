'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
} from '@tanstack/react-table'
import { useModal, ConfirmationModal } from '@payloadcms/ui'
import type { ProductVariant, Media } from '@/payload-types'
import './styles.scss'

interface VariantManagerProps {
  productId: string
  productName: string
  onVariantUpdate?: () => void
}

type VariantRow = ProductVariant & {
  id: string
}

type MediaType = string | Media

const columnHelper = createColumnHelper<VariantRow>()

export const VariantManager: React.FC<VariantManagerProps> = ({
  productId,
  productName,
  onVariantUpdate,
}) => {
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [editingVariant, setEditingVariant] = useState<VariantRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null)
  const { toggleModal } = useModal()

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/variants/product/${productId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch variants')
      }

      const result = await response.json()
      setVariants(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load variants')
      console.error('Error fetching variants:', err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchVariants()
  }, [fetchVariants])

  const _handleEdit = (variant: VariantRow) => {
    setEditingVariant(variant)
    setIsModalOpen(true)
  }

  const handleSave = async (updatedVariant: Partial<VariantRow>) => {
    if (!editingVariant) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/product-variants/${editingVariant.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedVariant),
      })

      if (!response.ok) {
        throw new Error('Failed to update variant')
      }

      await fetchVariants()
      setIsModalOpen(false)
      setEditingVariant(null)
      onVariantUpdate?.()
    } catch (err) {
      console.error('Error updating variant:', err)
      alert('Failed to update variant. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = useCallback(
    (variantId: string) => {
      setVariantToDelete(variantId)
      toggleModal('delete-variant-confirm')
    },
    [toggleModal],
  )

  const confirmDelete = useCallback(async () => {
    if (!variantToDelete) return

    try {
      const response = await fetch(`/api/product-variants/${variantToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete variant')
      }

      await fetchVariants()
      onVariantUpdate?.()
      setVariantToDelete(null)
    } catch (err) {
      console.error('Error deleting variant:', err)
      alert('Failed to delete variant. Please try again.')
    }
  }, [variantToDelete, fetchVariants, onVariantUpdate])

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedVariants.size === 0) return
    toggleModal('bulk-delete-confirm')
  }, [selectedVariants.size, toggleModal])

  const confirmBulkDelete = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedVariants).map((variantId) =>
          fetch(`/api/product-variants/${variantId}`, {
            method: 'DELETE',
            credentials: 'include',
          }),
        ),
      )

      await fetchVariants()
      setSelectedVariants(new Set())
      onVariantUpdate?.()
    } catch (err) {
      console.error('Error deleting variants:', err)
      alert('Failed to delete some variants. Please try again.')
    }
  }, [selectedVariants, fetchVariants, onVariantUpdate])

  const toggleVariantSelection = useCallback((variantId: string) => {
    setSelectedVariants((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(variantId)) {
        newSet.delete(variantId)
      } else {
        newSet.add(variantId)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set())
    } else {
      setSelectedVariants(new Set(variants.map((v) => v.id)))
    }
  }, [selectedVariants.size, variants])

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table: _table }) => (
          <input
            type="checkbox"
            checked={selectedVariants.size === variants.length && variants.length > 0}
            onChange={toggleSelectAll}
            style={{ cursor: 'pointer' }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedVariants.has(row.original.id)}
            onChange={() => toggleVariantSelection(row.original.id)}
            style={{ cursor: 'pointer' }}
          />
        ),
        size: 50,
      }),
      columnHelper.accessor('options', {
        header: 'Variant Name',
        cell: (info) => {
          const options = info.getValue()
          const variant = info.row.original
          const variantName = options?.map((opt) => opt.value).join(' / ') || 'Unnamed Variant'

          return (
            <a
              href={`/admin/collections/product-variants/${variant.id}`}
              className="variant-manager__variant-link"
              title="Edit variant"
            >
              {variantName}
            </a>
          )
        },
        enableSorting: false,
        size: 200,
      }),
      columnHelper.accessor('images', {
        header: 'Images',
        cell: (info) => {
          const images = info.getValue() as MediaType[] | undefined
          const imageCount = images?.length ?? 0

          if (imageCount === 0) {
            return <span className="variant-manager__no-images">No images</span>
          }

          const firstImage = images![0]
          const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage as Media)?.url

          return (
            <div className="variant-manager__images">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Variant" className="variant-manager__image-thumb" />
              )}
              {imageCount > 1 && (
                <span className="variant-manager__image-count">+{imageCount - 1}</span>
              )}
            </div>
          )
        },
        enableSorting: false,
        size: 100,
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: (info) => {
          const price = info.getValue()
          return price ? `${price.toFixed(2)}` : '-'
        },
        size: 100,
      }),
      columnHelper.accessor('quantity', {
        header: 'Stock',
        cell: (info) => {
          const row = info.row.original
          if (!row.trackQuantity) {
            return (
              <span className="variant-manager__stock-badge variant-manager__stock-badge--untracked">
                Not tracked
              </span>
            )
          }
          const qty = info.getValue() ?? 0
          return <span className="variant-manager__stock-qty">{qty}</span>
        },
        size: 80,
      }),
      columnHelper.accessor('stockStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          const statusClass = `variant-manager__stock-badge variant-manager__stock-badge--${status?.replace('_', '-')}`
          const statusText = status
            ?.split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          return <span className={statusClass}>{statusText}</span>
        },
        size: 120,
      }),
      columnHelper.accessor('isDefault', {
        header: 'Default',
        cell: (info) =>
          info.getValue() ? (
            <span className="variant-manager__default-badge">✓ Default</span>
          ) : null,
        size: 80,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const variant = info.row.original
          return (
            <div className="variant-manager__actions">
              <a
                href={`/admin/collections/product-variants/${variant.id}`}
                className="btn-edit"
                title="Edit variant"
              >
                Edit
              </a>
              <button
                type="button"
                onClick={() => handleDeleteClick(variant.id)}
                className="btn-delete"
                title="Delete variant"
              >
                Delete
              </button>
            </div>
          )
        },
        size: 150,
      }),
    ],
    [handleDeleteClick, selectedVariants, toggleSelectAll, toggleVariantSelection, variants],
  )

  const table = useReactTable({
    data: variants,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  })

  if (loading) {
    return (
      <div className="variant-manager__loading">
        <div className="spinner" />
        <p>Loading variants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="variant-manager__error">
        <p className="error-text">Error: {error}</p>
        <button type="button" onClick={fetchVariants} className="btn-retry">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="variant-manager">
      <div className="variant-manager__header">
        <div>
          <h3>Product Variants for: {productName}</h3>
          <p className="variant-manager__count">
            {variants.length} variant{variants.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {selectedVariants.size > 0 && (
          <button
            type="button"
            onClick={handleBulkDeleteClick}
            className="variant-manager__bulk-delete"
            style={{
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Delete Selected ({selectedVariants.size})
          </button>
        )}
      </div>

      {variants.length === 0 ? (
        <div className="variant-manager__empty">
          <p>No variants found for this product.</p>
          <p className="hint">
            Enable &ldquo;Has Variants&rdquo; and define variant options in the product to
            auto-generate variants.
          </p>
        </div>
      ) : (
        <>
          <div className="variant-manager__table-wrapper">
            <table className="variant-manager__table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={header.column.getCanSort() ? 'sortable' : ''}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className="header-content"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && ' ↑'}
                            {header.column.getIsSorted() === 'desc' && ' ↓'}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="variant-manager__pagination">
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              «
            </button>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              ‹
            </button>
            <span className="variant-manager__pagination-info">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              »
            </button>
          </div>
        </>
      )}

      {isModalOpen && editingVariant && (
        <VariantEditModal
          variant={editingVariant}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false)
            setEditingVariant(null)
          }}
          isSaving={isSaving}
        />
      )}

      <ConfirmationModal
        modalSlug="delete-variant-confirm"
        heading="Delete Variant"
        body={<p>Are you sure you want to delete this variant? This action cannot be undone.</p>}
        onConfirm={confirmDelete}
      />

      <ConfirmationModal
        modalSlug="bulk-delete-confirm"
        heading="Delete Multiple Variants"
        body={
          <p>
            Are you sure you want to delete {selectedVariants.size} variant
            {selectedVariants.size > 1 ? 's' : ''}? This action cannot be undone.
          </p>
        }
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}

interface VariantEditModalProps {
  variant: VariantRow
  onSave: (variant: Partial<VariantRow>) => Promise<void>
  onClose: () => void
  isSaving: boolean
}

const VariantEditModal: React.FC<VariantEditModalProps> = ({
  variant,
  onSave,
  onClose,
  isSaving,
}) => {
  const [formData, setFormData] = useState<{
    sku: string
    price: string
    compareAtPrice: string
    quantity: string
    lowStockThreshold: string
    trackQuantity: boolean
    stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'on_backorder' | 'discontinued'
    allowBackorders: boolean
    isDefault: boolean
  }>({
    sku: variant.sku || '',
    price: variant.price?.toString() || '',
    compareAtPrice: variant.compareAtPrice?.toString() || '',
    quantity: variant.quantity?.toString() || '0',
    lowStockThreshold: variant.lowStockThreshold?.toString() || '5',
    trackQuantity: variant.trackQuantity ?? true,
    stockStatus: variant.stockStatus || 'in_stock',
    allowBackorders: variant.allowBackorders ?? false,
    isDefault: variant.isDefault ?? false,
  })

  const images = (variant.images as MediaType[] | undefined) ?? []

  const handleSubmit = () => {
    const updatedVariant: Partial<VariantRow> = {
      sku: formData.sku,
      price: formData.price ? parseFloat(formData.price) : undefined,
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
      quantity: parseInt(formData.quantity) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
      trackQuantity: formData.trackQuantity,
      stockStatus: formData.stockStatus as VariantRow['stockStatus'],
      allowBackorders: formData.allowBackorders,
      isDefault: formData.isDefault,
    }

    onSave(updatedVariant)
  }

  return (
    <div className="variant-modal" onClick={onClose}>
      <div className="variant-modal__content" onClick={(e) => e.stopPropagation()}>
        <div className="variant-modal__header">
          <h3>Edit Variant</h3>
          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="variant-modal__body">
          {images.length > 0 && (
            <div className="variant-modal__images-section">
              <h4>Variant Images ({images.length})</h4>
              <div className="variant-modal__images-grid">
                {images.map((img, idx) => {
                  const imageUrl = typeof img === 'string' ? img : (img as Media)?.url
                  return imageUrl ? (
                    <div key={idx} className="variant-modal__image-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={`Variant image ${idx + 1}`} />
                    </div>
                  ) : null
                })}
              </div>
              <p className="variant-modal__image-note">
                To manage images, go to the main ProductVariants collection
              </p>
            </div>
          )}

          <div className="variant-modal__form-row">
            <div className="variant-modal__form-group">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="variant-modal__form-group">
              <label htmlFor="compareAtPrice">Compare at Price</label>
              <input
                id="compareAtPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="variant-modal__form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.trackQuantity}
                onChange={(e) => setFormData({ ...formData, trackQuantity: e.target.checked })}
                disabled={isSaving}
              />
              Track Inventory
            </label>
          </div>

          {formData.trackQuantity && (
            <div className="variant-modal__form-row">
              <div className="variant-modal__form-group">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  disabled={isSaving}
                />
              </div>

              <div className="variant-modal__form-group">
                <label htmlFor="lowStockThreshold">Low Stock Threshold</label>
                <input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {!formData.trackQuantity && (
            <div className="variant-modal__form-group">
              <label htmlFor="stockStatus">Stock Status</label>
              <select
                id="stockStatus"
                value={formData.stockStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockStatus: e.target.value as typeof formData.stockStatus,
                  })
                }
                disabled={isSaving}
              >
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="on_backorder">On Backorder</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          )}

          {formData.trackQuantity && (
            <div className="variant-modal__form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.allowBackorders}
                  onChange={(e) => setFormData({ ...formData, allowBackorders: e.target.checked })}
                  disabled={isSaving}
                />
                Allow Backorders
              </label>
            </div>
          )}

          <div className="variant-modal__form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                disabled={isSaving}
              />
              Set as Default Variant
            </label>
          </div>

          <div className="variant-modal__footer">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSaving}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
