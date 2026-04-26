'use client'

import { useState } from 'react'

export type Claim = {
  id: string
  collegeName: string
  collegeCity: string | null
  collegeState: string | null
  adminName: string
  adminPhone: string
  userEmail: string
  counsellorName: string | null
  counsellorPhone: string | null
  createdAt: string
}

function ClaimCard({
  claim,
  onApprove,
  onReject,
}: {
  claim: Claim
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function approve() {
    setLoading(true)
    await fetch(`/api/admin/claims/${claim.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approved' }),
    })
    onApprove(claim.id)
  }

  async function reject() {
    setLoading(true)
    await fetch(`/api/admin/claims/${claim.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rejected', reason }),
    })
    onReject(claim.id)
    setRejectOpen(false)
    setLoading(false)
  }

  return (
    <div className="rounded-3xl bg-md-surface-container p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-medium text-md-on-surface">{claim.collegeName}</h3>
        {(claim.collegeCity || claim.collegeState) && (
          <p className="text-sm text-md-on-surface-variant">
            {[claim.collegeCity, claim.collegeState].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-md-surface-container-low rounded-2xl p-3">
          <p className="text-xs text-md-on-surface-variant mb-0.5">Admin</p>
          <p className="font-medium text-md-on-surface">{claim.adminName}</p>
          <p className="text-md-on-surface-variant">{claim.userEmail}</p>
          <p className="text-md-on-surface-variant">{claim.adminPhone}</p>
        </div>
        {(claim.counsellorName || claim.counsellorPhone) && (
          <div className="bg-md-surface-container-low rounded-2xl p-3">
            <p className="text-xs text-md-on-surface-variant mb-0.5">Counsellor</p>
            <p className="font-medium text-md-on-surface">{claim.counsellorName ?? '—'}</p>
            <p className="text-md-on-surface-variant">{claim.counsellorPhone ?? '—'}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-md-on-surface-variant">
        Submitted{' '}
        {new Date(claim.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>

      <div className="flex gap-2 pt-1">
        <button
          onClick={approve}
          disabled={loading}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors duration-200 active:scale-95 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => setRejectOpen(o => !o)}
          disabled={loading}
          className="rounded-full border border-md-outline px-5 py-2 text-sm font-medium text-md-on-surface hover:bg-md-primary/5 transition-colors duration-200 active:scale-95"
        >
          Reject
        </button>
      </div>

      {rejectOpen && (
        <div className="space-y-2 pt-1">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Rejection reason (optional)"
            rows={3}
            className="w-full rounded-2xl border border-md-outline/30 bg-md-surface-container-low px-4 py-3 text-sm text-md-on-surface placeholder:text-md-on-surface-variant/50 outline-none focus:border-md-primary resize-none"
          />
          <button
            onClick={reject}
            disabled={loading}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors duration-200 active:scale-95 disabled:opacity-50"
          >
            Confirm Reject
          </button>
        </div>
      )}
    </div>
  )
}

export function ClaimsTab({
  initialClaims,
  onUpdate,
}: {
  initialClaims: Claim[]
  onUpdate?: (claims: Claim[]) => void
}) {
  const [claims, setClaims] = useState(initialClaims)

  function removeClaim(id: string) {
    const next = claims.filter(cl => cl.id !== id)
    setClaims(next)
    onUpdate?.(next)
  }

  if (claims.length === 0) {
    return (
      <div className="text-center py-16 text-md-on-surface-variant">
        No pending college claims.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {claims.map(claim => (
        <ClaimCard
          key={claim.id}
          claim={claim}
          onApprove={removeClaim}
          onReject={removeClaim}
        />
      ))}
    </div>
  )
}
