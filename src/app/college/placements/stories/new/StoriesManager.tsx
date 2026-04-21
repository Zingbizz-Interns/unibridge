'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

type Story = {
  id: string
  studentName: string
  batch: string | null
  company: string | null
  role: string | null
  ctc: string | null
  imagePath: string | null
  imageUrl: string | null
  story: string | null
}

type StoryFormState = {
  studentName: string
  batch: string
  company: string
  role: string
  ctc: string
  story: string
}

const initialFormState: StoryFormState = {
  studentName: '',
  batch: '',
  company: '',
  role: '',
  ctc: '',
  story: '',
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatCtc(value: string | null) {
  if (!value) {
    return 'Package not shared'
  }

  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return 'Package not shared'
  }

  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1)} LPA`
}

export default function StoriesManager() {
  const [stories, setStories] = useState<Story[]>([])
  const [form, setForm] = useState<StoryFormState>(initialFormState)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [editingStory, setEditingStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadStories = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/college/stories', { cache: 'no-store' })
        const result = (await response.json()) as { error?: string; stories?: Story[] }

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load success stories')
        }

        if (!cancelled) {
          setStories(result.stories || [])
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(fetchError, 'Failed to load success stories'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadStories()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(editingStory?.imageUrl || null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [editingStory?.imageUrl, selectedFile])

  const storyPreview = useMemo(
    () => ({
      studentName: form.studentName || 'Student Name',
      batch: form.batch || 'Batch Year',
      company: form.company || 'Company',
      role: form.role || 'Role',
      ctc: form.ctc || '',
      story:
        form.story ||
        'A short quote about the student journey, placement support, and the opportunity they landed.',
    }),
    [form]
  )

  const handleChange = (field: keyof StoryFormState, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const resetForm = () => {
    setForm(initialFormState)
    setEditingStory(null)
    setSelectedFile(null)
  }

  const handleEdit = (story: Story) => {
    setEditingStory(story)
    setForm({
      studentName: story.studentName,
      batch: story.batch || '',
      company: story.company || '',
      role: story.role || '',
      ctc: story.ctc || '',
      story: story.story || '',
    })
    setSelectedFile(null)
    setError('')
    setSuccess('')
  }

  const uploadPhotoIfNeeded = async () => {
    if (!selectedFile) {
      return editingStory?.imagePath
    }

    const signResponse = await fetch('/api/storage/sign-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        size: selectedFile.size,
        bucket: 'stories',
      }),
    })
    const signResult = (await signResponse.json()) as {
      error?: string
      signedUrl?: string
      path?: string
    }

    if (!signResponse.ok || !signResult.signedUrl || !signResult.path) {
      throw new Error(signResult.error || 'Failed to prepare story photo upload')
    }

    const uploadResponse = await fetch(signResult.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': selectedFile.type },
      body: selectedFile,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload story photo')
    }

    return signResult.path
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const imagePath = await uploadPhotoIfNeeded()

      if (!editingStory && !imagePath) {
        throw new Error('Student photo is required for a new success story')
      }

      const response = await fetch(
        editingStory ? `/api/college/stories/${editingStory.id}` : '/api/college/stories',
        {
          method: editingStory ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            imagePath,
          }),
        }
      )

      const result = (await response.json()) as { error?: string; story?: Story }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save success story')
      }

      if (!result.story) {
        throw new Error('Success story response was empty')
      }

      const savedStory = result.story

      setStories((currentStories) =>
        editingStory
          ? currentStories.map((story) => (story.id === savedStory.id ? savedStory : story))
          : [savedStory, ...currentStories]
      )
      setSuccess(editingStory ? 'Success story updated.' : 'Success story published.')
      resetForm()
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError, 'Failed to save success story'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (story: Story) => {
    const confirmed = window.confirm(`Delete the story for ${story.studentName}?`)

    if (!confirmed) {
      return
    }

    setDeletingId(story.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/college/stories/${story.id}`, {
        method: 'DELETE',
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete success story')
      }

      setStories((currentStories) => currentStories.filter((item) => item.id !== story.id))
      setSuccess('Success story deleted.')

      if (editingStory?.id === story.id) {
        resetForm()
      }
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Failed to delete success story'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_1.35fr]">
      <div className="space-y-8">
        <Card elevation="elevated">
          <CardHeader>
            <CardTitle className="text-2xl">
              {editingStory ? 'Edit Success Story' : 'Create Success Story'}
            </CardTitle>
            <CardDescription>
              Add a photo, role, package, and a short quote from the student journey.
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
                <label htmlFor="studentName" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Student name
                </label>
                <Input
                  id="studentName"
                  value={form.studentName}
                  onChange={(event) => handleChange('studentName', event.target.value)}
                  placeholder="e.g. Ananya Rao"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="batch" className="mb-1 block text-sm font-medium text-md-on-surface">
                    Batch year
                  </label>
                  <Input
                    id="batch"
                    value={form.batch}
                    onChange={(event) => handleChange('batch', event.target.value)}
                    placeholder="e.g. 2025"
                    maxLength={4}
                  />
                </div>

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
                    placeholder="e.g. 16"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="company" className="mb-1 block text-sm font-medium text-md-on-surface">
                    Company
                  </label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(event) => handleChange('company', event.target.value)}
                    placeholder="e.g. Deloitte"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="mb-1 block text-sm font-medium text-md-on-surface">
                    Role
                  </label>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(event) => handleChange('role', event.target.value)}
                    placeholder="e.g. Analyst"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="storyPhoto" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Student photo
                </label>
                <input
                  id="storyPhoto"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  className="block w-full rounded-2xl border border-md-outline/20 bg-md-surface-container-low px-4 py-3 text-sm text-md-on-surface"
                />
                <p className="mt-2 text-xs text-md-on-surface-variant">
                  {editingStory
                    ? 'Leave this unchanged to keep the current student photo.'
                    : 'Upload a square or portrait image for the public story card.'}
                </p>
              </div>

              <div>
                <label htmlFor="story" className="mb-1 block text-sm font-medium text-md-on-surface">
                  Story / quote
                </label>
                <textarea
                  id="story"
                  rows={5}
                  value={form.story}
                  onChange={(event) => handleChange('story', event.target.value)}
                  placeholder="A short quote about the student journey, placement support, or growth story."
                  className="w-full rounded-3xl border border-md-outline/20 bg-md-surface-container-low px-4 py-3 text-base text-md-on-surface placeholder:text-md-on-surface-variant/60 focus:border-md-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingStory ? 'Update Story' : 'Publish Story'}
                </Button>
                {editingStory ? (
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
            <CardTitle className="text-xl">Live Preview</CardTitle>
            <CardDescription>
              This is close to how the story card will feel on the public college page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <article className="overflow-hidden rounded-3xl border border-md-outline/15 bg-md-surface-container-low">
              <div className="h-56 w-full bg-md-surface-container">
                {previewUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${previewUrl})` }}
                    role="img"
                    aria-label={storyPreview.studentName}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-md-on-surface-variant">
                    Student photo preview
                  </div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <h3 className="text-xl font-medium text-md-on-surface">{storyPreview.studentName}</h3>
                  <p className="text-sm text-md-on-surface-variant">
                    Batch {storyPreview.batch}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-md-on-surface-variant">
                  <span>{storyPreview.company}</span>
                  <span>{storyPreview.role}</span>
                  <span>{formatCtc(storyPreview.ctc || null)}</span>
                </div>
                <p className="text-sm leading-6 text-md-on-surface">
                  &ldquo;{storyPreview.story}&rdquo;
                </p>
              </div>
            </article>
          </CardContent>
        </Card>
      </div>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Published Stories</CardTitle>
          <CardDescription>
            Manage the stories already visible on your college profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              Loading success stories...
            </div>
          ) : stories.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No success stories published yet.
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <article
                  key={story.id}
                  className="rounded-3xl border border-md-outline/15 bg-md-surface-container-low p-5"
                >
                  <div className="flex flex-col gap-5 md:flex-row">
                    <div className="h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-md-surface-container md:w-32">
                      {story.imageUrl ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${story.imageUrl})` }}
                          role="img"
                          aria-label={story.studentName}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-md-on-surface-variant">
                          No photo
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-medium text-md-on-surface">{story.studentName}</h3>
                        <p className="text-sm text-md-on-surface-variant">
                          Batch {story.batch || 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-md-on-surface-variant">
                        <span>{story.company || 'Company not shared'}</span>
                        <span>{story.role || 'Role not shared'}</span>
                        <span>{formatCtc(story.ctc)}</span>
                      </div>
                      <p className="text-sm leading-6 text-md-on-surface">
                        {story.story || 'No story shared.'}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button type="button" variant="outline" onClick={() => handleEdit(story)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={deletingId === story.id}
                          onClick={() => void handleDelete(story)}
                        >
                          {deletingId === story.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
