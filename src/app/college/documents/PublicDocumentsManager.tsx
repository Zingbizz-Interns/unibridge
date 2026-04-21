'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDocumentTypeLabel, publicDocumentOptions, type PublicDocumentType } from '@/lib/college-content'

type DocumentRecord = {
  id: string
  type: string
  fileName: string | null
  storageBucket: string
  storagePath: string
  publicUrl: string | null
  uploadedAt: string | null
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Unknown date'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date'
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function PublicDocumentsManager() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [documentType, setDocumentType] = useState<PublicDocumentType>('brochure')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadDocuments = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/college/documents', { cache: 'no-store' })
        const result = (await response.json()) as {
          error?: string
          documents?: DocumentRecord[]
        }

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load public documents')
        }

        if (!cancelled) {
          setDocuments(result.documents || [])
        }
      } catch (fetchError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(fetchError, 'Failed to load public documents'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [])

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedFile) {
      setError('Select a PDF document before uploading.')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')

    try {
      const signResponse = await fetch('/api/storage/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          size: selectedFile.size,
          bucket: 'publicDocuments',
        }),
      })
      const signResult = (await signResponse.json()) as {
        error?: string
        signedUrl?: string
        path?: string
      }

      if (!signResponse.ok || !signResult.signedUrl || !signResult.path) {
        throw new Error(signResult.error || 'Failed to prepare document upload')
      }

      const uploadResponse = await fetch(signResult.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload document to storage')
      }

      const saveResponse = await fetch('/api/college/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: documentType,
          fileName: selectedFile.name,
          storagePath: signResult.path,
        }),
      })
      const saveResult = (await saveResponse.json()) as {
        error?: string
        document?: DocumentRecord
      }

      if (!saveResponse.ok || !saveResult.document) {
        throw new Error(saveResult.error || 'Failed to save document record')
      }

      const savedDocument = saveResult.document

      setDocuments((currentDocuments) => [savedDocument, ...currentDocuments])
      setSelectedFile(null)
      setSuccess('Public document uploaded successfully.')
    } catch (uploadError: unknown) {
      setError(getErrorMessage(uploadError, 'Failed to upload public document'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (document: DocumentRecord) => {
    const confirmed = window.confirm(`Delete ${document.fileName || 'this document'}?`)

    if (!confirmed) {
      return
    }

    setDeletingId(document.id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/college/documents/${document.id}`, {
        method: 'DELETE',
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document')
      }

      setDocuments((currentDocuments) =>
        currentDocuments.filter((item) => item.id !== document.id)
      )
      setSuccess('Document deleted.')
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Failed to delete document'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1.4fr]">
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Upload Public Document</CardTitle>
          <CardDescription>
            Upload PDF-only files for students to download from your profile.
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

          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label htmlFor="publicDocumentType" className="mb-1 block text-sm font-medium text-md-on-surface">
                Document type
              </label>
              <select
                id="publicDocumentType"
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value as PublicDocumentType)}
                className="h-14 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface focus:border-md-primary focus:outline-none"
              >
                {publicDocumentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="publicDocumentFile" className="mb-1 block text-sm font-medium text-md-on-surface">
                PDF file
              </label>
              <input
                id="publicDocumentFile"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="block w-full rounded-2xl border border-md-outline/20 bg-md-surface-container-low px-4 py-3 text-sm text-md-on-surface"
              />
              <p className="mt-2 text-xs text-md-on-surface-variant">
                Maximum size: 10 MB. Students will see this as a direct download.
              </p>
            </div>

            <Button type="submit" disabled={!selectedFile || isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Document Vault</CardTitle>
          <CardDescription>
            Review every public file currently available on your college profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              Loading public documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No public documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-3xl border border-md-outline/15 bg-md-surface-container-low p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-md-secondary-container px-3 py-1 text-xs font-medium text-md-on-secondary-container">
                          {formatDocumentTypeLabel(document.type)}
                        </span>
                        <span className="text-xs text-md-on-surface-variant">
                          Uploaded {formatDate(document.uploadedAt)}
                        </span>
                      </div>
                      <p className="font-medium text-md-on-surface">
                        {document.fileName || formatDocumentTypeLabel(document.type)}
                      </p>
                      <p className="text-sm text-md-on-surface-variant">
                        {document.publicUrl || 'Public URL unavailable'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {document.publicUrl ? (
                        <Button asChild variant="outline">
                          <a href={document.publicUrl} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={deletingId === document.id}
                        onClick={() => void handleDelete(document)}
                      >
                        {deletingId === document.id ? 'Deleting...' : 'Delete'}
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
