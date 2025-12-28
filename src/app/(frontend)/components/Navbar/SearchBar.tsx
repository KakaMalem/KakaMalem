'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  /** Optional store slug - when provided, search is scoped to this store */
  storeSlug?: string
  /** Optional placeholder text */
  placeholder?: string
}

export default function SearchBar({ storeSlug, placeholder }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const defaultPlaceholder = storeSlug ? 'جستجو در این فروشگاه...' : 'جستجوی محصولات...'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (storeSlug) {
      // Store-specific search - navigate to store page with search query
      if (searchQuery.trim()) {
        router.push(`/store/${storeSlug}?q=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        router.push(`/store/${storeSlug}`)
      }
    } else {
      // Global search - navigate to home page with search query
      if (searchQuery.trim()) {
        router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        router.push('/')
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 lg:max-w-xl mx-auto">
      <div className="relative group">
        <input
          type="text"
          placeholder={placeholder || defaultPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input w-full pl-10 pr-4 bg-base-200 border-0 focus:ring-2 focus:ring-primary/20 hover:bg-base-300/50 transition-all duration-200"
        />
        <button
          type="submit"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content/60 transition-colors"
          aria-label="Search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}
