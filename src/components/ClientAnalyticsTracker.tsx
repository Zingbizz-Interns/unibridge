'use client'
import { useEffect } from 'react'

export function ClientAnalyticsTracker({ collegeId, eventType }: { collegeId: string, eventType: string }) {
  useEffect(() => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collegeId, eventType })
    }).catch(console.error)
  }, [collegeId, eventType])
  
  return null
}
