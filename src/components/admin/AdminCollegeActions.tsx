'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export function AdminCollegeActions({
  collegeId,
  status,
  redirectOnDelete,
  compact = false,
}: {
  collegeId: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | null | undefined
  redirectOnDelete?: string
  compact?: boolean
}) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'suspend' | 'restore' | 'delete' | null>(null)
  const [error, setError] = useState('')

  const resolvedStatus = status || 'pending'
  const suspendAction = resolvedStatus === 'suspended' ? 'restore' : 'suspend'

  async function handleSuspendRestore() {
    setPendingAction(suspendAction)
    setError('')

    try {
      const res = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspendAction }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update college status')
      }

      router.refresh()
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete this college and all related data? This cannot be undone.'
    )

    if (!confirmed) {
      return
    }

    setPendingAction('delete')
    setError('')

    try {
      const res = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete college')
      }

      if (redirectOnDelete) {
        router.push(redirectOnDelete)
      } else {
        router.refresh()
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className={`flex ${compact ? 'flex-wrap' : 'flex-col sm:flex-row'} gap-2`}>
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'default'}
          onClick={handleSuspendRestore}
          disabled={pendingAction !== null}
        >
          {pendingAction === suspendAction
            ? suspendAction === 'restore'
              ? 'Restoring...'
              : 'Suspending...'
            : suspendAction === 'restore'
              ? 'Restore'
              : 'Suspend'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={compact ? 'sm' : 'default'}
          className="border-rose-300 text-rose-700 hover:bg-rose-50"
          onClick={handleDelete}
          disabled={pendingAction !== null}
        >
          {pendingAction === 'delete' ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
    </div>
  )
}
