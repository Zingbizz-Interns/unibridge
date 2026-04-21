'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

type EnquiryRow = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  createdAt: string | null
  readAt: string | null
  isRead: boolean
  preview: string
}

type FilterValue = 'all' | 'unread'

function formatDate(value: string | null) {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

function buildGmailComposeUrl(enquiry: EnquiryRow) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    tf: '1',
    to: enquiry.email,
    su: `Re: Your enquiry to our college`,
    body: [
      `Hi ${enquiry.name},`,
      '',
      '',
      'Original enquiry details:',
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      `Phone: ${enquiry.phone || 'Not shared'}`,
      `Received: ${formatDate(enquiry.createdAt)}`,
      '',
      'Message:',
      enquiry.message || 'No message body provided.',
    ].join('\n'),
  })

  return `https://mail.google.com/mail/?${params.toString()}`
}

export default function CollegeEnquiriesInbox() {
  const [filter, setFilter] = useState<FilterValue>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enquiries, setEnquiries] = useState<EnquiryRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    setLoading(true)
    setError('')

    fetch(`/api/college/enquiries?filter=${filter}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          error?: string
          enquiries?: EnquiryRow[]
          unreadCount?: number
        }

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load enquiries.')
        }

        if (!cancelled) {
          setEnquiries(payload.enquiries ?? [])
          setUnreadCount(payload.unreadCount ?? 0)
        }
      })
      .catch((fetchError) => {
        if (!cancelled && !(fetchError instanceof DOMException && fetchError.name === 'AbortError')) {
          setError(getErrorMessage(fetchError))
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
  }, [filter])

  const handleToggleRead = async (enquiry: EnquiryRow) => {
    setUpdatingId(enquiry.id)
    setError('')

    try {
      const response = await fetch(`/api/college/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !enquiry.isRead }),
      })
      const payload = (await response.json()) as { error?: string; enquiry?: { isRead: boolean } }

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update enquiry.')
      }

      const nextRead = payload.enquiry?.isRead ?? !enquiry.isRead
      setEnquiries((currentEnquiries) =>
        currentEnquiries
          .map((currentEnquiry) =>
            currentEnquiry.id === enquiry.id
              ? {
                  ...currentEnquiry,
                  isRead: nextRead,
                  readAt: nextRead ? new Date().toISOString() : null,
                }
              : currentEnquiry
          )
          .filter((currentEnquiry) => filter === 'unread' ? !currentEnquiry.isRead : true)
      )

      setUnreadCount((currentCount) =>
        nextRead ? Math.max(0, currentCount - 1) : currentCount + 1
      )
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-md-primary">
            Counsellor Inbox
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            Enquiries from students
          </h1>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            Review incoming questions, keep track of unread messages, and open Gmail drafts in a new tab when replying.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-md-secondary-container px-4 py-2 text-sm text-md-on-secondary-container">
          <span className="font-medium">{unreadCount}</span>
          <span>Unread enquiries</span>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {(['all', 'unread'] as const).map((tab) => (
          <Button
            key={tab}
            type="button"
            variant={filter === tab ? 'default' : 'outline'}
            onClick={() => setFilter(tab)}
          >
            {tab === 'all' ? 'All' : 'Unread'}
          </Button>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-errorContainer px-4 py-3 text-sm text-onErrorContainer">
          {error}
        </div>
      )}

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Inbox</CardTitle>
          <CardDescription>
            Click a row to expand the full message and mark it as read once reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              Loading enquiries...
            </div>
          ) : enquiries.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              {filter === 'unread'
                ? 'No unread enquiries right now.'
                : 'No enquiries have arrived yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {enquiries.map((enquiry) => {
                const expanded = expandedId === enquiry.id

                return (
                  <div
                    key={enquiry.id}
                    className={`rounded-3xl border p-4 transition-colors ${
                      enquiry.isRead
                        ? 'border-md-outline/10 bg-md-surface-container-low'
                        : 'border-md-primary/20 bg-md-secondary-container/35'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : enquiry.id)}
                      className="w-full text-left"
                    >
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1.1fr_1fr_1fr_0.8fr]">
                        <div>
                          <p className="font-medium text-md-on-surface">{enquiry.name}</p>
                          <p className="text-sm text-md-on-surface-variant">{enquiry.email}</p>
                        </div>
                        <div className="text-sm text-md-on-surface-variant">
                          {enquiry.phone || 'Phone not shared'}
                        </div>
                        <div className="text-sm text-md-on-surface-variant">
                          {enquiry.preview}
                        </div>
                        <div className="text-sm text-md-on-surface-variant">
                          {formatDate(enquiry.createdAt)}
                        </div>
                        <div className="flex items-start justify-between gap-3 lg:justify-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              enquiry.isRead
                                ? 'bg-md-surface text-md-on-surface-variant'
                                : 'bg-md-primary text-md-on-primary'
                            }`}
                          >
                            {enquiry.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="mt-4 border-t border-md-outline/10 pt-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-md-on-surface">
                          {enquiry.message || 'No message body provided.'}
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <a
                            href={buildGmailComposeUrl(enquiry)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-md-primary hover:underline"
                          >
                            Reply in Gmail
                          </a>
                          <Button
                            variant="outline"
                            onClick={() => handleToggleRead(enquiry)}
                            disabled={updatingId === enquiry.id}
                          >
                            {updatingId === enquiry.id
                              ? 'Saving...'
                              : enquiry.isRead
                                ? 'Mark as Unread'
                                : 'Mark as Read'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
