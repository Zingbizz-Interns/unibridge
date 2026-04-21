'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import ApplicationStatusBadge, { formatApplicationStatus } from '@/components/ApplicationStatusBadge'

const statusActions = [
  { value: 'under_review', label: 'Mark Under Review', variant: 'outline' as const },
  { value: 'shortlisted', label: 'Shortlist', variant: 'outline' as const },
  { value: 'accepted', label: 'Accept', variant: 'default' as const },
  { value: 'rejected', label: 'Reject', variant: 'outline' as const },
]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to update application status'
}

export default function ApplicationStatusPanel({
  applicationId,
  currentStatus,
}: {
  applicationId: string
  currentStatus: string | null
}) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [error, setError] = useState('')

  const updateStatus = async (status: string) => {
    setPendingStatus(status)
    setError('')

    try {
      const response = await fetch(`/api/college/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          note: note.trim() || undefined,
        }),
      })
      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update application status')
      }

      setNote('')
      router.refresh()
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setPendingStatus(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-md-on-surface-variant">Current status</p>
        <div className="mt-2">
          <ApplicationStatusBadge status={currentStatus} />
        </div>
      </div>

      <div>
        <label htmlFor="statusNote" className="mb-1 block text-sm font-medium text-md-on-surface">
          Timeline note or student-facing context
        </label>
        <textarea
          id="statusNote"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="Optional note for the timeline and update email."
          className="w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 py-3 text-sm text-md-on-surface placeholder:text-md-on-surface-variant/60 focus:border-md-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {statusActions.map((action) => (
          <Button
            key={action.value}
            variant={action.variant}
            disabled={pendingStatus !== null || currentStatus === action.value}
            onClick={() => updateStatus(action.value)}
            className={action.value === 'rejected' ? 'border-red-300 text-red-700 hover:bg-red-50' : undefined}
          >
            {pendingStatus === action.value
              ? 'Updating...'
              : currentStatus === action.value
                ? `${formatApplicationStatus(action.value)} Active`
                : action.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
