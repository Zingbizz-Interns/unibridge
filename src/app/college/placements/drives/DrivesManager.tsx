'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

type Drive = {
  id: string
  companyName: string
  role: string | null
  ctc: string | null
  driveDate: string | null
  studentsPlaced: number | null
  createdAt: string | null
}

type DriveFormState = {
  companyName: string
  role: string
  ctc: string
  driveDate: string
  studentsPlaced: string
}

const initialFormState: DriveFormState = {
  companyName: '',
  role: '',
  ctc: '',
  driveDate: '',
  studentsPlaced: '',
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatCtc(value: string | null) {
  if (!value) {
    return 'Not shared'
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 'Not shared'
  }

  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1)} LPA`
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Date not shared'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Date not shared'
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function DrivesManager() {
  const [drives, setDrives] = useState<Drive[]>([])
  const [form, setForm] = useState<DriveFormState>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'ctc'>('date')

  useEffect(() => {
    let cancelled = false

    const loadDrives = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/college/drives', { cache: 'no-store' })
        const result = (await response.json()) as { error?: string; drives?: Drive[] }

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load campus drives')
        }

        if (!cancelled) {
          setDrives(result.drives || [])
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(fetchError, 'Failed to load campus drives'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDrives()

    return () => {
      cancelled = true
    }
  }, [])

  const sortedDrives = useMemo(() => {
    const nextDrives = [...drives]

    nextDrives.sort((left, right) => {
      if (sortBy === 'ctc') {
        return Number(right.ctc || 0) - Number(left.ctc || 0)
      }

      return new Date(right.driveDate || 0).getTime() - new Date(left.driveDate || 0).getTime()
    })

    return nextDrives
  }, [drives, sortBy])

  const handleChange = (field: keyof DriveFormState, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const resetForm = () => {
    setForm(initialFormState)
    setEditingId(null)
  }

  const handleEdit = (drive: Drive) => {
    setEditingId(drive.id)
    setForm({
      companyName: drive.companyName,
      role: drive.role || '',
      ctc: drive.ctc || '',
      driveDate: drive.driveDate || '',
      studentsPlaced: drive.studentsPlaced !== null ? String(drive.studentsPlaced) : '',
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        editingId ? `/api/college/drives/${editingId}` : '/api/college/drives',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )

      const result = (await response.json()) as { error?: string; drive?: Drive }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save campus drive')
      }

      if (!result.drive) {
        throw new Error('Drive response was empty')
      }

      const savedDrive = result.drive

      setDrives((currentDrives) =>
        editingId
          ? currentDrives.map((drive) => (drive.id === savedDrive.id ? savedDrive : drive))
          : [savedDrive, ...currentDrives]
      )
      setSuccess(editingId ? 'Campus drive updated.' : 'Campus drive created.')
      resetForm()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Failed to save campus drive'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (drive: Drive) => {
    const confirmed = window.confirm(`Delete the ${drive.companyName} campus drive entry?`)

    if (!confirmed) {
      return
    }

    setDeletingId(drive.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/college/drives/${drive.id}`, {
        method: 'DELETE',
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete campus drive')
      }

      setDrives((currentDrives) => currentDrives.filter((item) => item.id !== drive.id))
      setSuccess('Campus drive deleted.')

      if (editingId === drive.id) {
        resetForm()
      }
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Failed to delete campus drive'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_1.4fr]">
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">
            {editingId ? 'Edit Campus Drive' : 'Add Campus Drive'}
          </CardTitle>
          <CardDescription>
            Track company visits, offered roles, compensation, and number of students placed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-2xl bg-errorContainer p-4 text-sm text-onErrorContainer">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-2xl bg-green-100 p-4 text-sm font-medium text-green-800">
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="companyName" className="mb-1 block text-sm font-medium text-md-on-surface">
                Company name
              </label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(event) => handleChange('companyName', event.target.value)}
                placeholder="e.g. Infosys"
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium text-md-on-surface">
                Role / job title
              </label>
              <Input
                id="role"
                value={form.role}
                onChange={(event) => handleChange('role', event.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="ctc" className="mb-1 block text-sm font-medium text-md-on-surface">
                  CTC (LPA)
                </label>
                <Input
                  id="ctc"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.ctc}
                  onChange={(event) => handleChange('ctc', event.target.value)}
                  placeholder="e.g. 12"
                />
              </div>

              <div>
                <label htmlFor="studentsPlaced" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Students placed
                </label>
                <Input
                  id="studentsPlaced"
                  type="number"
                  min="0"
                  value={form.studentsPlaced}
                  onChange={(event) => handleChange('studentsPlaced', event.target.value)}
                  placeholder="e.g. 18"
                />
              </div>
            </div>

            <div>
              <label htmlFor="driveDate" className="mb-1 block text-sm font-medium text-md-on-surface">
                Drive date
              </label>
              <Input
                id="driveDate"
                type="date"
                value={form.driveDate}
                onChange={(event) => handleChange('driveDate', event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Drive' : 'Add Drive'}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card elevation="elevated">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">Campus Drive Log</CardTitle>
            <CardDescription>
              Review and update your placement drive history.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={sortBy === 'date' ? 'default' : 'outline'}
              onClick={() => setSortBy('date')}
            >
              Sort by date
            </Button>
            <Button
              type="button"
              variant={sortBy === 'ctc' ? 'default' : 'outline'}
              onClick={() => setSortBy('ctc')}
            >
              Sort by CTC
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              Loading campus drives...
            </div>
          ) : sortedDrives.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No campus drives added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDrives.map((drive) => (
                <div
                  key={drive.id}
                  className="rounded-3xl border border-md-outline/15 bg-md-surface-container-low p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-md-on-surface">{drive.companyName}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-md-on-surface-variant">
                        <span>{drive.role || 'Role not specified'}</span>
                        <span>{formatCtc(drive.ctc)}</span>
                        <span>{formatDate(drive.driveDate)}</span>
                        <span>
                          {drive.studentsPlaced !== null
                            ? `${drive.studentsPlaced} placed`
                            : 'Placement count not shared'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={() => handleEdit(drive)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={deletingId === drive.id}
                        onClick={() => void handleDelete(drive)}
                      >
                        {deletingId === drive.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
