'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useCompare, type CompareItem } from './CompareProvider'

export function CompareToggleButton({
  college,
  className,
}: {
  college: CompareItem
  className?: string
}) {
  const { items, hydrated, addItem, removeItem, isSelected } = useCompare()
  const [feedback, setFeedback] = useState('')

  const selected = isSelected(college.id)
  const compareLimitReached = items.length >= 3 && !selected

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeout = window.setTimeout(() => setFeedback(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [feedback])

  const handleToggle = () => {
    if (selected) {
      removeItem(college.id)
      setFeedback('')
      return
    }

    const result = addItem(college)
    if (!result.ok && result.reason === 'max') {
      setFeedback('You can compare up to 3 colleges.')
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={selected ? 'tonal' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={!hydrated}
        title={compareLimitReached ? 'Max 3 colleges' : undefined}
        className={`w-full ${compareLimitReached ? 'border-md-outline/40 text-md-on-surface-variant' : ''}`}
      >
        {selected
          ? 'Remove from Compare'
          : compareLimitReached
            ? 'Max 3 Colleges'
            : 'Add to Compare'}
      </Button>
      {feedback && (
        <p className="mt-2 text-xs text-md-primary">
          {feedback}
        </p>
      )}
    </div>
  )
}
