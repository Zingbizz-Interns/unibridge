'use client'

import { useEffect } from 'react'
import { useCompare, type CompareItem } from './CompareProvider'

export default function CompareSelectionSync({
  items,
}: {
  items: CompareItem[]
}) {
  const { replaceItems } = useCompare()

  useEffect(() => {
    if (items.length > 0) {
      replaceItems(items)
    }
  }, [items, replaceItems])

  return null
}
