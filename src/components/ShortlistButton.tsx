'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function ShortlistButton({
  collegeId,
  initialIsShortlisted = false,
  className,
}: {
  collegeId: string
  initialIsShortlisted?: boolean
  className?: string
}) {
  const [isShortlisted, setIsShortlisted] = useState(initialIsShortlisted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleShortlist = async () => {
    setLoading(true)

    try {
      if (isShortlisted) {
        const res = await fetch(`/api/shortlist?collegeId=${collegeId}`, {
          method: 'DELETE',
        })

        if (res.status === 401) {
          router.push('/login')
          return
        }

        if (res.ok) {
          setIsShortlisted(false)
        }
      } else {
        const res = await fetch('/api/shortlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collegeId }),
        })

        if (res.status === 401) {
          router.push('/login')
          return
        }

        if (res.ok) {
          setIsShortlisted(true)
        }
      }
    } catch {
      // Ignore toggle failures for now and preserve the current state.
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={toggleShortlist}
      disabled={loading}
      aria-pressed={isShortlisted}
      variant={isShortlisted ? "tonal" : "outline"}
      className={cn(className)}
      suppressHydrationWarning
    >
      {loading ? 'Saving...' : isShortlisted ? 'Shortlisted' : 'Shortlist'}
    </Button>
  )
}
