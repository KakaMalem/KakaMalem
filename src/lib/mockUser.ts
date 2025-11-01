// lib/mockUser.ts
import { User } from '@/payload-types' // optional typing — adjust if you don't have this
// Centralized mock user and orders used across the app

export const MOCK_USER = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1 (555) 123-4567',
  addresses: [
    {
      id: '1',
      label: 'Home',
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      phone: '+1 (555) 123-4567',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Office',
      firstName: 'John',
      lastName: 'Doe',
      address1: '456 Business Ave',
      address2: 'Suite 200',
      city: 'New York',
      state: 'NY',
      postalCode: '10002',
      country: 'United States',
      phone: '+1 (555) 987-6543',
      isDefault: false,
    },
  ],
  preferences: {
    currency: 'USD',
    newsletter: true,
  },
} as unknown as User

export const MOCK_ORDERS = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    status: 'delivered',
    total: 299.99,
    currency: 'USD',
    createdAt: '2024-01-15',
    items: 2,
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    status: 'shipped',
    total: 149.5,
    currency: 'USD',
    createdAt: '2024-01-20',
    items: 1,
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    status: 'processing',
    total: 89.99,
    currency: 'USD',
    createdAt: '2024-01-25',
    items: 3,
  },
]

// Helper accessors (return clones so consumers can mutate safely)
export function getMockUser() {
  return JSON.parse(JSON.stringify(MOCK_USER))
}

export function getMockOrders() {
  return JSON.parse(JSON.stringify(MOCK_ORDERS))
}
