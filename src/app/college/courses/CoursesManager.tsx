'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { COURSE_LEVELS } from '@/validators/course'

type Course = {
  id: string
  name: string
  degree: string | null
  duration: number | null
  courseLevel: string | null
  stream: string | null
  totalFee: string | null
  annualFee: string | null
  seats: number | null
  placementPercent: string | null
  avgPackage: string | null
  createdAt: string | null
}

type CourseFormState = {
  name: string
  degree: string
  duration: string
  courseLevel: string
  stream: string
  totalFee: string
  annualFee: string
  seats: string
  placementPercent: string
  avgPackage: string
}

const initialFormState: CourseFormState = {
  name: '',
  degree: '',
  duration: '',
  courseLevel: '',
  stream: '',
  totalFee: '',
  annualFee: '',
  seats: '',
  placementPercent: '',
  avgPackage: '',
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatCurrency(value: string | null) {
  if (!value) {
    return 'Not shared'
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 'Not shared'
  }

  return numericValue.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2,
  })
}

function formatPercent(value: string | null) {
  if (!value) {
    return 'Not shared'
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 'Not shared'
  }

  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 2)}%`
}

function formatLpa(value: string | null) {
  if (!value) {
    return 'Not shared'
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 'Not shared'
  }

  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 2)} LPA`
}

export default function CoursesManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [form, setForm] = useState<CourseFormState>(initialFormState)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadCourses = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/college/courses', { cache: 'no-store' })
        const result = (await response.json()) as { error?: string; courses?: Course[] }

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load courses')
        }

        if (!cancelled) {
          setCourses(result.courses || [])
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(fetchError, 'Failed to load courses'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const orderedCourses = useMemo(
    () =>
      [...courses].sort((left, right) =>
        `${left.name} ${left.degree || ''}`.localeCompare(`${right.name} ${right.degree || ''}`)
      ),
    [courses]
  )

  const handleChange = (field: keyof CourseFormState, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const resetForm = () => {
    setForm(initialFormState)
    setEditingId(null)
  }

  const handleEdit = (course: Course) => {
    setEditingId(course.id)
    setForm({
      name: course.name,
      degree: course.degree || '',
      duration: course.duration !== null ? String(course.duration) : '',
      courseLevel: course.courseLevel || '',
      stream: course.stream || '',
      totalFee: course.totalFee || '',
      annualFee: course.annualFee || '',
      seats: course.seats !== null ? String(course.seats) : '',
      placementPercent: course.placementPercent || '',
      avgPackage: course.avgPackage || '',
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
        editingId ? `/api/college/courses/${editingId}` : '/api/college/courses',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )

      const result = (await response.json()) as { error?: string; course?: Course }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save course')
      }

      if (!result.course) {
        throw new Error('Course response was empty')
      }

      const savedCourse = result.course

      setCourses((currentCourses) =>
        editingId
          ? currentCourses.map((course) => (course.id === savedCourse.id ? savedCourse : course))
          : [savedCourse, ...currentCourses]
      )
      setSuccess(editingId ? 'Course updated.' : 'Course added.')
      resetForm()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Failed to save course'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (course: Course) => {
    const confirmed = window.confirm(`Delete ${course.name}${course.degree ? ` (${course.degree})` : ''}?`)

    if (!confirmed) {
      return
    }

    setDeletingId(course.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/college/courses/${course.id}`, {
        method: 'DELETE',
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete course')
      }

      setCourses((currentCourses) => currentCourses.filter((item) => item.id !== course.id))
      setSuccess('Course deleted.')

      if (editingId === course.id) {
        resetForm()
      }
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Failed to delete course'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_1.4fr]">
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">
            {editingId ? 'Edit Course' : 'Add Course'}
          </CardTitle>
          <CardDescription>
            Publish course details used in student applications and public college discovery.
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
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-md-on-surface">
                Course name
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                placeholder="e.g. Computer Science and Engineering"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="degree" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Degree
                </label>
                <Input
                  id="degree"
                  value={form.degree}
                  onChange={(event) => handleChange('degree', event.target.value)}
                  placeholder="e.g. B.Tech"
                />
              </div>
              <div>
                <label htmlFor="courseLevel" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Course Level
                </label>
                <select
                  id="courseLevel"
                  value={form.courseLevel}
                  onChange={(event) => handleChange('courseLevel', event.target.value)}
                  className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
                >
                  <option value="">- Select Level -</option>
                  {COURSE_LEVELS.map((level) => (
                    <option key={level} value={level}>{level.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="stream" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Stream / Department
                </label>
                <Input
                  id="stream"
                  value={form.stream}
                  onChange={(event) => handleChange('stream', event.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
              <div>
                <label htmlFor="duration" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Duration (years)
                </label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="12"
                  value={form.duration}
                  onChange={(event) => handleChange('duration', event.target.value)}
                  placeholder="e.g. 4"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="totalFee" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Total fee (INR)
                </label>
                <Input
                  id="totalFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalFee}
                  onChange={(event) => handleChange('totalFee', event.target.value)}
                  placeholder="e.g. 850000"
                />
              </div>
              <div>
                <label htmlFor="annualFee" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Annual fee (INR)
                </label>
                <Input
                  id="annualFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.annualFee}
                  onChange={(event) => handleChange('annualFee', event.target.value)}
                  placeholder="e.g. 210000"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="seats" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Seats
                </label>
                <Input
                  id="seats"
                  type="number"
                  min="0"
                  value={form.seats}
                  onChange={(event) => handleChange('seats', event.target.value)}
                  placeholder="e.g. 120"
                />
              </div>
              <div>
                <label htmlFor="placementPercent" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Placement %
                </label>
                <Input
                  id="placementPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.placementPercent}
                  onChange={(event) => handleChange('placementPercent', event.target.value)}
                  placeholder="e.g. 92.5"
                />
              </div>
              <div>
                <label htmlFor="avgPackage" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Avg package (LPA)
                </label>
                <Input
                  id="avgPackage"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.avgPackage}
                  onChange={(event) => handleChange('avgPackage', event.target.value)}
                  placeholder="e.g. 14.2"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Course' : 'Add Course'}
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
        <CardHeader>
          <CardTitle className="text-2xl">Published Courses</CardTitle>
          <CardDescription>
            Students can only apply after at least one course is published.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              Loading courses...
            </div>
          ) : orderedCourses.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No courses added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orderedCourses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-3xl border border-md-outline/15 bg-md-surface-container-low p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-md-on-surface">{course.name}</h3>
                          {course.courseLevel && (
                            <span className="px-2 py-0.5 bg-md-primary/10 text-md-primary text-[10px] rounded-md font-bold uppercase">
                              {course.courseLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-md-on-surface-variant">
                          {course.degree || 'Degree not specified'}
                          {course.stream ? ` | ${course.stream}` : ''}
                          {course.duration !== null ? ` | ${course.duration} years` : ''}
                          {course.seats !== null ? ` | ${course.seats} seats` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-md-on-surface-variant">
                        <span>Total: {formatCurrency(course.totalFee)}</span>
                        <span>Annual: {formatCurrency(course.annualFee)}</span>
                        <span>Placement: {formatPercent(course.placementPercent)}</span>
                        <span>Avg package: {formatLpa(course.avgPackage)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={() => handleEdit(course)}>
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={deletingId === course.id}
                        onClick={() => void handleDelete(course)}
                      >
                        {deletingId === course.id ? 'Deleting...' : 'Delete'}
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
