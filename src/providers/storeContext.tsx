'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface StoreContext {
  storeSlug: string | null
  storeName: string | null
}

interface StoreContextValue {
  storeContext: StoreContext
  setStoreContext: (context: StoreContext | null) => void
  clearStoreContext: () => void
  getHomeUrl: () => string
}

const STORAGE_KEY = 'kakamalem-store-context'

const StoreContextContext = createContext<StoreContextValue>({
  storeContext: { storeSlug: null, storeName: null },
  setStoreContext: () => {},
  clearStoreContext: () => {},
  getHomeUrl: () => '/',
})

export const StoreContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeContext, setStoreContextState] = useState<StoreContext>({
    storeSlug: null,
    storeName: null,
  })

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.storeSlug) {
          setStoreContextState(parsed)
        }
      }
    } catch {
      // Ignore errors
    }
  }, [])

  const setStoreContext = (context: StoreContext | null) => {
    if (context && context.storeSlug) {
      setStoreContextState(context)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(context))
      } catch {
        // Ignore errors
      }
    } else {
      clearStoreContext()
    }
  }

  const clearStoreContext = () => {
    setStoreContextState({ storeSlug: null, storeName: null })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore errors
    }
  }

  const getHomeUrl = () => {
    return storeContext.storeSlug ? `/store/${storeContext.storeSlug}` : '/'
  }

  return (
    <StoreContextContext.Provider
      value={{
        storeContext,
        setStoreContext,
        clearStoreContext,
        getHomeUrl,
      }}
    >
      {children}
    </StoreContextContext.Provider>
  )
}

export const useStoreContext = () => useContext(StoreContextContext)
