'use client'

import React from 'react'
import { useFormFields, useDocumentInfo } from '@payloadcms/ui'
import { UserLocationMap } from './Component'

type UserLocationMapFieldProps = {
  path: string
  label: string
}

export const UserLocationMapField: React.FC<UserLocationMapFieldProps> = ({ path, label }) => {
  // Get document ID to force remount on navigation between users
  const { id: docId } = useDocumentInfo()

  // Get user name fields
  const firstNameField = useFormFields(([fields]) => fields['firstName'])
  const lastNameField = useFormFields(([fields]) => fields['lastName'])

  // Get location fields
  const coordinatesField = useFormFields(([fields]) => fields['location.coordinates'])
  const accuracyField = useFormFields(([fields]) => fields['location.accuracy'])
  const countryField = useFormFields(([fields]) => fields['location.country'])
  const countryCodeField = useFormFields(([fields]) => fields['location.countryCode'])
  const regionField = useFormFields(([fields]) => fields['location.region'])
  const cityField = useFormFields(([fields]) => fields['location.city'])
  const timezoneField = useFormFields(([fields]) => fields['location.timezone'])
  const sourceField = useFormFields(([fields]) => fields['location.source'])
  const eventField = useFormFields(([fields]) => fields['location.event'])
  const ipField = useFormFields(([fields]) => fields['location.ip'])
  const permissionGrantedField = useFormFields(([fields]) => fields['location.permissionGranted'])
  const lastUpdatedField = useFormFields(([fields]) => fields['location.lastUpdated'])

  // Get location history
  const locationHistoryField = useFormFields(([fields]) => fields['locationHistory'])

  // Build user name
  const userName = [firstNameField?.value as string, lastNameField?.value as string]
    .filter(Boolean)
    .join(' ')

  // Build location data object
  const locationData = {
    coordinates: coordinatesField?.value as [number, number] | null | undefined,
    accuracy: accuracyField?.value as number | null | undefined,
    country: countryField?.value as string | null | undefined,
    countryCode: countryCodeField?.value as string | null | undefined,
    region: regionField?.value as string | null | undefined,
    city: cityField?.value as string | null | undefined,
    timezone: timezoneField?.value as string | null | undefined,
    source: sourceField?.value as 'browser' | 'ip' | 'manual' | null | undefined,
    event: eventField?.value as
      | 'login'
      | 'register'
      | 'order'
      | 'browser_permission'
      | 'verify_email'
      | 'oauth'
      | null
      | undefined,
    ip: ipField?.value as string | null | undefined,
    permissionGranted: permissionGrantedField?.value as boolean | undefined,
    lastUpdated: lastUpdatedField?.value as string | null | undefined,
  }

  // Parse location history
  const locationHistory =
    (locationHistoryField?.value as Array<{
      coordinates?: [number, number] | null
      city?: string | null
      country?: string | null
      source?: 'browser' | 'ip' | null
      event?:
        | 'login'
        | 'register'
        | 'order'
        | 'browser_permission'
        | 'verify_email'
        | 'oauth'
        | null
      timestamp?: string | null
    }>) || []

  return (
    <UserLocationMap
      key={docId ?? 'new'}
      path={path}
      label={label}
      locationData={locationData}
      locationHistory={locationHistory}
      userName={userName}
    />
  )
}
