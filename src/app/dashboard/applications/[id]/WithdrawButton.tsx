'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to withdraw application'
}

export default function WithdrawButton({
  applicationId,
}: {
  applicationId: string
}) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleWithdraw = async () => {
    if (
      !confirm(
        'Are you sure you want to withdraw this application? This action cannot be undone.'
      )
    ) {
      return
    }

    setIsWithdrawing(true)
    setError('')

    try {
      const response = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: 'PATCH',
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to withdraw application')
      }

      router.refresh()
    } catch (withdrawError: unknown) {
      setError(getErrorMessage(withdrawError))
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div>
      {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
      <button
        onClick={handleWithdraw}
        disabled={isWithdrawing}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
      </button>
    </div>
  )
}
