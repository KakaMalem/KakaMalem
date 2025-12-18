'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { OrderLocationMap } from './Component'

type OrderLocationMapFieldProps = {
  path: string
  label: string
}

export const OrderLocationMapField: React.FC<OrderLocationMapFieldProps> = ({ path, label }) => {
  // Get the coordinates from the form state
  const latitudeField = useFormFields(([fields]) => fields['shippingAddress.coordinates.latitude'])
  const longitudeField = useFormFields(
    ([fields]) => fields['shippingAddress.coordinates.longitude'],
  )

  const latitude = latitudeField?.value as number | undefined
  const longitude = longitudeField?.value as number | undefined

  return <OrderLocationMap path={path} label={label} latitude={latitude} longitude={longitude} />
}
