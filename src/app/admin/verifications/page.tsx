'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminCollegeStatusBadge } from '@/components/admin/AdminCollegeStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ClaimsTab, type Claim } from './ClaimsTab'

type VerificationStatus = 'pending' | 'approved' | 'rejected'

type CollegeRow = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  type: string | null
  createdAt: string
  verificationStatus: VerificationStatus | 'suspended'
  documents: { id: string; type: string; fileName: string | null }[]
}

const REJECTION_PRESETS = [
  'Documents are unclear or unreadable',
  'Invalid or expired documents',
  'Incomplete submission - missing required documents',
  'Documents do not match college details',
  'Other',
]

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function RejectModal({
  collegeName,
  onConfirm,
  onCancel,
  submitting,
}: {
  collegeName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  submitting: boolean
}) {
  const [preset, setPreset] = useState(REJECTION_PRESETS[0])
  const [notes, setNotes] = useState('')

  const isOther = preset === 'Other'
  const isValid = !isOther || notes.trim().length > 0

  const handleConfirm = () => {
    const reason = isOther
      ? `Other - ${notes.trim()}`
      : notes.trim()
        ? `${preset} - ${notes.trim()}`
        : preset
    onConfirm(reason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-md-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-md-on-surface">Reject {collegeName}</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="rejectPreset" className="mb-1 block text-sm font-medium text-md-on-surface">
              Reason
            </label>
            <select
              id="rejectPreset"
              value={preset}
              onChange={(event) => setPreset(event.target.value)}
              className="h-12 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface focus:border-md-primary focus:outline-none"
            >
              {REJECTION_PRESETS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rejectNotes" className="mb-1 block text-sm font-medium text-md-on-surface">
              Additional notes {isOther && <span className="text-rose-700">*</span>}
            </label>
            <textarea
              id="rejectNotes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder={isOther ? 'Describe the issue...' : 'Optional context for the college...'}
              className="w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 py-3 text-sm text-md-on-surface focus:border-md-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-rose-700 text-white hover:bg-rose-800"
            onClick={handleConfirm}
            disabled={!isValid || submitting}
          >
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function PreviewModal({
  document,
  onClose,
}: {
  document: { id: string; title: string }
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col rounded-3xl bg-md-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-md-outline/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-md-on-surface">{document.title}</h2>
            <p className="text-sm text-md-on-surface-variant">
              Previewing the uploaded verification document.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/api/admin/documents/${document.id}/download`}>Download</a>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 p-4">
          <iframe
            src={`/api/admin/documents/${document.id}/download?mode=preview`}
            title={document.title}
            className="h-full w-full rounded-2xl border border-md-outline/10 bg-white"
          />
        </div>
      </div>
    </div>
  )
}

function FilterTabs({
  active,
  onChange,
}: {
  active: VerificationStatus
  onChange: (status: VerificationStatus) => void
}) {
  const tabs: VerificationStatus[] = ['pending', 'approved', 'rejected']

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab}
          type="button"
          size="sm"
          variant={active === tab ? 'default' : 'outline'}
          onClick={() => onChange(tab)}
          className="capitalize"
        >
          {tab}
        </Button>
      ))}
    </div>
  )
}

export default function AdminVerificationsPage() {
  const [mainTab, setMainTab] = useState<'colleges' | 'claims'>('colleges')

  const [status, setStatus] = useState<VerificationStatus>('pending')
  const [colleges, setColleges] = useState<CollegeRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<CollegeRow | null>(null)
  const [previewDocument, setPreviewDocument] = useState<{ id: string; title: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [claims, setClaims] = useState<Claim[]>([])
  const [claimsLoading, setClaimsLoading] = useState(false)
  const [claimsError, setClaimsError] = useState('')

  useEffect(() => {
    if (mainTab !== 'claims') return
    setClaimsLoading(true)
    setClaimsError('')
    fetch('/api/admin/claims')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load claims')
        setClaims(data)
      })
      .catch((err: unknown) => {
        setClaimsError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => setClaimsLoading(false))
  }, [mainTab])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    setLoading(true)
    setFetchError('')
    setActionError('')
    setSuccessMessage('')

    fetch(`/api/admin/colleges?status=${status}&page=${page}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load colleges')
        }
        return data
      })
      .then((data) => {
        if (!cancelled) {
          setColleges(data.colleges ?? [])
          setTotal(data.total ?? 0)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof Error && error.name !== 'AbortError') {
          setFetchError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [status, page])

  useEffect(() => {
    setSelectedIds([])
  }, [status, page])

  const pendingPageIds = useMemo(
    () => colleges.filter((college) => college.verificationStatus === 'pending').map((college) => college.id),
    [colleges]
  )

  const isAllSelected =
    pendingPageIds.length > 0 && pendingPageIds.every((id) => selectedIds.includes(id))

  function handleFilterChange(nextStatus: VerificationStatus) {
    setStatus(nextStatus)
    setPage(1)
  }

  function removeCollegeFromCurrentList(id: string) {
    setColleges((current) => {
      const next = current.filter((college) => college.id !== id)
      if (next.length === 0 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      }
      return next
    })
    setTotal((current) => Math.max(0, current - 1))
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id))
  }

  async function handleApprove(id: string) {
    setSubmittingId(id)
    setActionError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/colleges/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved' }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve college')
      }

      if (status === 'pending') {
        removeCollegeFromCurrentList(id)
      }

      setSuccessMessage('College approved successfully.')
    } catch (error: unknown) {
      setActionError(getErrorMessage(error))
    } finally {
      setSubmittingId(null)
    }
  }

  async function handleRejectConfirm(reason: string) {
    if (!rejectTarget) {
      return
    }

    const id = rejectTarget.id
    setSubmittingId(id)
    setActionError('')
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/colleges/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejected', reason }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject college')
      }

      setRejectTarget(null)

      if (status === 'pending') {
        removeCollegeFromCurrentList(id)
      }

      setSuccessMessage('College rejected successfully.')
    } catch (error: unknown) {
      setActionError(getErrorMessage(error))
    } finally {
      setSubmittingId(null)
    }
  }

  async function handleBulkApprove() {
    if (selectedIds.length === 0) {
      return
    }

    setBulkSubmitting(true)
    setActionError('')
    setSuccessMessage('')

    try {
      const response = await fetch('/api/admin/colleges/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk approve colleges')
      }

      const approvedIds = (data.approvedIds as string[]) ?? []
      if (status === 'pending') {
        setColleges((current) => current.filter((college) => !approvedIds.includes(college.id)))
        setTotal((current) => Math.max(0, current - approvedIds.length))
      }
      setSelectedIds([])
      setSuccessMessage(`${data.approvedCount ?? approvedIds.length} colleges approved.`)
    } catch (error: unknown) {
      setActionError(getErrorMessage(error))
    } finally {
      setBulkSubmitting(false)
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    )
  }

  function toggleSelectAll() {
    setSelectedIds((current) => {
      if (isAllSelected) {
        return current.filter((id) => !pendingPageIds.includes(id))
      }

      return [...new Set([...current, ...pendingPageIds])]
    })
  }

  const totalPages = Math.ceil(total / limit)
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  return (
    <div className="space-y-8 animate-page-enter">
      {rejectTarget && (
        <RejectModal
          collegeName={rejectTarget.name}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
          submitting={submittingId === rejectTarget.id}
        />
      )}

      {previewDocument && (
        <PreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-md-on-surface">College Verifications</h1>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            Review college documents, approve trusted institutions faster, and send clear rejection feedback when something is missing.
          </p>
        </div>

        {mainTab === 'colleges' && status === 'pending' && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-md-on-surface-variant">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                disabled={pendingPageIds.length === 0 || bulkSubmitting}
                className="h-4 w-4 rounded border-md-outline"
              />
              Select all on page
            </label>
            <Button
              type="button"
              variant="default"
              onClick={handleBulkApprove}
              disabled={selectedIds.length === 0 || bulkSubmitting}
            >
              {bulkSubmitting ? 'Approving...' : `Bulk Approve (${selectedIds.length})`}
            </Button>
          </div>
        )}
      </div>

      {/* Main tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setMainTab('colleges')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
            mainTab === 'colleges'
              ? 'bg-md-secondary-container text-md-on-secondary-container'
              : 'text-md-on-surface-variant hover:bg-md-primary/8'
          }`}
        >
          Pending Colleges
          {status === 'pending' && total > 0 && (
            <span className="ml-2 rounded-full bg-md-primary px-2 py-0.5 text-xs text-white">
              {total}
            </span>
          )}
        </button>
        <button
          onClick={() => setMainTab('claims')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
            mainTab === 'claims'
              ? 'bg-md-secondary-container text-md-on-secondary-container'
              : 'text-md-on-surface-variant hover:bg-md-primary/8'
          }`}
        >
          College Claims
          {claims.length > 0 && (
            <span className="ml-2 rounded-full bg-md-primary px-2 py-0.5 text-xs text-white">
              {claims.length}
            </span>
          )}
        </button>
      </div>

      {mainTab === 'claims' ? (
        <>
          {claimsError && (
            <div className="rounded-2xl bg-rose-100 p-4 text-sm text-rose-800">{claimsError}</div>
          )}
          {claimsLoading ? (
            <div className="py-16 text-center text-sm text-md-on-surface-variant">Loading claims...</div>
          ) : (
            <ClaimsTab
              initialClaims={claims}
              onUpdate={setClaims}
            />
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs active={status} onChange={handleFilterChange} />
            {total > 0 && (
              <span className="text-sm text-md-on-surface-variant">
                Showing {rangeStart}-{rangeEnd} of {total}
              </span>
            )}
          </div>

          {fetchError && (
            <div className="rounded-2xl bg-rose-100 p-4 text-sm text-rose-800">{fetchError}</div>
          )}

          {actionError && (
            <div className="rounded-2xl bg-rose-100 p-4 text-sm text-rose-800">{actionError}</div>
          )}

          {successMessage && (
            <div className="rounded-2xl bg-emerald-100 p-4 text-sm text-emerald-800">
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-md-on-surface-variant">Loading queue...</div>
          ) : colleges.length === 0 ? (
            <Card elevation="elevated">
              <CardContent className="py-14 text-center">
                <CardTitle className="text-md-on-surface-variant">No {status} colleges</CardTitle>
                <CardDescription>Nothing to review in this tab right now.</CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {colleges.map((college) => (
                <Card key={college.id} elevation="elevated">
                  <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        {status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(college.id)}
                            onChange={() => toggleSelection(college.id)}
                            className="h-4 w-4 rounded border-md-outline"
                            aria-label={`Select ${college.name}`}
                          />
                        )}
                        <CardTitle className="text-2xl">{college.name}</CardTitle>
                        <AdminCollegeStatusBadge status={college.verificationStatus} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-md-on-surface-variant">
                        <span>
                          {[college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable'}
                        </span>
                        {college.type && <span>{college.type}</span>}
                        <span>Submitted {formatDate(college.createdAt)}</span>
                      </div>
                    </div>

                    {status === 'pending' && (
                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setRejectTarget(college)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50"
                          disabled={submittingId === college.id}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handleApprove(college.id)}
                          disabled={submittingId === college.id}
                        >
                          {submittingId === college.id ? 'Approving...' : 'Approve'}
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <h4 className="mb-4 text-sm font-medium uppercase tracking-wide text-md-on-surface-variant">
                      Uploaded Documents
                    </h4>
                    {college.documents.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {college.documents.map((document) => (
                          <div
                            key={document.id}
                            className="flex items-center justify-between gap-4 rounded-3xl border border-md-outline/10 bg-md-surface p-4"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-md-on-surface">
                                {document.fileName || document.type.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-md-on-surface-variant">
                                {document.type.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPreviewDocument({
                                    id: document.id,
                                    title: document.fileName || document.type.replace(/_/g, ' '),
                                  })
                                }
                              >
                                Preview
                              </Button>
                              <Button asChild variant="tonal" size="sm">
                                <a href={`/api/admin/documents/${document.id}/download`}>Download</a>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-rose-700">No documents uploaded.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-md-on-surface-variant">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
