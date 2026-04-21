'use client'

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type CompareItem = {
  id: string
  name: string
  slug: string
}

type CompareContextValue = {
  items: CompareItem[]
  hydrated: boolean
  addItem: (item: CompareItem) => { ok: boolean; reason?: 'max' }
  removeItem: (id: string) => void
  clearItems: () => void
  replaceItems: (items: CompareItem[]) => void
  isSelected: (id: string) => boolean
}

const storageKey = 'unibridge.compare.colleges'
const maxCompareItems = 3

const CompareContext = createContext<CompareContextValue | null>(null)

function sanitizeItems(items: CompareItem[]) {
  return Array.from(
    new Map(items.map((item) => [item.id, item])).values()
  ).slice(0, maxCompareItems)
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(storageKey)
      if (rawValue) {
        const parsedValue = JSON.parse(rawValue) as CompareItem[]
        setItems(sanitizeItems(parsedValue))
      }
    } catch (error) {
      console.error('Failed to restore compare selections:', error)
      window.localStorage.removeItem(storageKey)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items))
  }, [hydrated, items])

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id))
  }, [])

  const clearItems = useCallback(() => {
    setItems([])
  }, [])

  const replaceItems = useCallback((nextItems: CompareItem[]) => {
    setItems(sanitizeItems(nextItems))
  }, [])

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      hydrated,
      addItem(item) {
        if (items.some((existingItem) => existingItem.id === item.id)) {
          return { ok: true }
        }

        if (items.length >= maxCompareItems) {
          return { ok: false, reason: 'max' }
        }

        setItems((currentItems) => [...currentItems, item])
        return { ok: true }
      },
      removeItem,
      clearItems,
      replaceItems,
      isSelected(id) {
        return items.some((item) => item.id === id)
      },
    }),
    [clearItems, hydrated, items, removeItem, replaceItems]
  )

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)

  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider')
  }

  return context
}

export type { CompareItem }
