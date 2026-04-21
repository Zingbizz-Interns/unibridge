'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function ShareCompareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch (error) {
      console.error('Failed to copy compare URL:', error)
    }
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      {copied ? 'Link Copied' : 'Share'}
    </Button>
  )
}
