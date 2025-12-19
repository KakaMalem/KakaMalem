'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'
import { OrderLocationMap } from './Component'

type OrderLocationMapFieldProps = {
  path: string
  label: string
}

export const OrderLocationMapField: React.FC<OrderLocationMapFieldProps> = ({ path, label }) => {
  // Get all the shipping address fields from the form state
  const firstNameField = useFormFields(([fields]) => fields['shippingAddress.firstName'])
  const lastNameField = useFormFields(([fields]) => fields['shippingAddress.lastName'])
  const stateField = useFormFields(([fields]) => fields['shippingAddress.state'])
  const countryField = useFormFields(([fields]) => fields['shippingAddress.country'])
  const phoneField = useFormFields(([fields]) => fields['shippingAddress.phone'])
  const nearbyLandmarkField = useFormFields(([fields]) => fields['shippingAddress.nearbyLandmark'])
  const detailedDirectionsField = useFormFields(
    ([fields]) => fields['shippingAddress.detailedDirections'],
  )

  // Get coordinate fields including source data
  const latitudeField = useFormFields(([fields]) => fields['shippingAddress.coordinates.latitude'])
  const longitudeField = useFormFields(
    ([fields]) => fields['shippingAddress.coordinates.longitude'],
  )
  const accuracyField = useFormFields(([fields]) => fields['shippingAddress.coordinates.accuracy'])
  const sourceField = useFormFields(([fields]) => fields['shippingAddress.coordinates.source'])
  const ipField = useFormFields(([fields]) => fields['shippingAddress.coordinates.ip'])

  // Build the address data object
  const addressData = {
    firstName: (firstNameField?.value as string) || undefined,
    lastName: (lastNameField?.value as string) || undefined,
    state: (stateField?.value as string) || undefined,
    country: (countryField?.value as string) || undefined,
    phone: (phoneField?.value as string) || undefined,
    nearbyLandmark: (nearbyLandmarkField?.value as string) || undefined,
    detailedDirections: (detailedDirectionsField?.value as string) || undefined,
    coordinates: {
      latitude: latitudeField?.value as number | undefined,
      longitude: longitudeField?.value as number | undefined,
      accuracy: accuracyField?.value as number | undefined,
      source: sourceField?.value as 'gps' | 'ip' | 'manual' | 'map' | undefined,
      ip: ipField?.value as string | undefined,
    },
  }

  return <OrderLocationMap path={path} label={label} addressData={addressData} />
}
