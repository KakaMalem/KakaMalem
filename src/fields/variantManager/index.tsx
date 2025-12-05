'use client'

import React from 'react'
import { useField, useDocumentInfo } from '@payloadcms/ui'
import type { FieldClientComponent } from 'payload'
import { VariantManager } from './components/VariantManager'

/**
 * Custom field component that renders the Variant Manager
 * This is displayed in the Products collection admin UI
 */
const VariantManagerField: FieldClientComponent = () => {
  const { value: hasVariants } = useField<boolean>({ path: 'hasVariants' })
  const { value: productName } = useField<string>({ path: 'name' })
  const { id: docID } = useDocumentInfo()

  // Only show the variant manager if:
  // 1. We're editing an existing product (docID exists)
  // 2. The product has variants enabled
  if (!docID || !hasVariants) {
    return null
  }

  return (
    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <VariantManager
        productId={docID as string}
        productName={(productName as string) || 'Product'}
        onVariantUpdate={() => {
          // Optional: trigger a refresh or notification
          console.log('Variants updated')
        }}
      />
    </div>
  )
}

export default VariantManagerField
export type { FieldClientComponent }
