'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const TRACKER_STORAGE_KEY = 'discovery:last-search-params'
const NON_FILTER_KEYS = new Set(['page'])

function toQueryMap(searchParams: URLSearchParams) {
  const map = new Map<string, string>()

  for (const [key, value] of searchParams.entries()) {
    if (!value) continue
    map.set(key, value)
  }

  return map
}

function hasActiveFilters(values: Map<string, string>) {
  for (const [key, value] of values) {
    if (NON_FILTER_KEYS.has(key)) continue
    if (value.trim() !== '') return true
  }

  return false
}

function extractMeta(values: Map<string, string>) {
  const meta: Record<string, string> = {}

  for (const [key, value] of values) {
    meta[key] = value
  }

  return meta
}

async function trackEvent(eventType: string, meta: Record<string, string>) {
  await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, meta }),
  })
}

export function DiscoveryAnalyticsTracker() {
  const searchParams = useSearchParams()
  const lastParamsRef = useRef<string>('')

  useEffect(() => {
    const currentParams = searchParams.toString()
    const previousParams =
      lastParamsRef.current
      || (typeof window !== 'undefined'
        ? window.sessionStorage.getItem(TRACKER_STORAGE_KEY) ?? ''
        : '')

    if (currentParams === previousParams) {
      return
    }

    const currentMap = toQueryMap(new URLSearchParams(currentParams))
    const previousMap = toQueryMap(new URLSearchParams(previousParams))

    const currentHasFilters = hasActiveFilters(currentMap)
    const previousHasFilters = hasActiveFilters(previousMap)
    const currentCategory = currentMap.get('category') ?? 'all'
    const previousCategory = previousMap.get('category') ?? 'all'
    const isFirstPage = !currentMap.get('page') || currentMap.get('page') === '1'
    const meta = extractMeta(currentMap)

    if (currentHasFilters && isFirstPage) {
      trackEvent('apply_filter', meta).catch(console.error)
    }

    if (currentCategory !== previousCategory && currentCategory !== 'all') {
      trackEvent('select_category', { ...meta, category: currentCategory }).catch(console.error)
    }

    if (previousHasFilters && !currentHasFilters) {
      trackEvent('clear_filter', { from: 'discovery' }).catch(console.error)
    }

    lastParamsRef.current = currentParams
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(TRACKER_STORAGE_KEY, currentParams)
    }
  }, [searchParams])

  return null
}
