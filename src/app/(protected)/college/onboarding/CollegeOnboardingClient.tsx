'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { verificationDocumentOptions } from '@/lib/college-content'
import { getDashboardPath } from '@/lib/dashboard'
import {
  collegeProfileSchema,
  type CollegeProfileData,
  type CollegeProfileInput,
  COLLEGE_CATEGORIES,
  COLLEGE_TYPES_NEW,
  COLLEGE_TYPES,
  INDIAN_STATES,
  NAAC_GRADES,
} from '@/validators/college-profile'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

type DocumentType = (typeof verificationDocumentOptions)[number]['value']
type UploadErrorKind = 'size' | 'general'
type WizardStep = {
  title: string
  detail: string
}

const onboardingSteps: WizardStep[] = [
  {
    title: 'Profile Details',
    detail: 'Share your institution profile details.',
  },
  {
    title: 'Upload Documents',
    detail: 'Upload verification documents for review.',
  },
]

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

function StepIndicator({ current, steps }: { current: number; steps: WizardStep[] }) {
  const progress = steps.length === 1 ? 100 : ((current - 1) / (steps.length - 1)) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.08em] text-onSurfaceVariant">
        <span>Setup Wizard</span>
        <span>Step {current} of {steps.length}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceContainer">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === current
          const isComplete = stepNumber < current

          return (
            <div
              key={step.title}
              className={`rounded-2xl border p-3 transition-colors ${
                isActive
                  ? 'border-primary/40 bg-primary/5'
                  : isComplete
                    ? 'border-secondaryContainer bg-secondaryContainer/60'
                    : 'border-outlineVariant/50 bg-surfaceContainer'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-primary text-onPrimary'
                      : isComplete
                        ? 'bg-secondary text-onSecondary'
                        : 'bg-surface text-onSurfaceVariant'
                  }`}
                >
                  {isComplete ? 'OK' : stepNumber}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isActive ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-onSurfaceVariant">{step.detail}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function UploadErrorBanner({ kind, message }: { kind: UploadErrorKind | null; message: string }) {
  if (!message) {
    return null
  }

  const isSizeError = kind === 'size'

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isSizeError
          ? 'border-red-500 bg-red-50 text-red-700'
          : 'border-transparent bg-errorContainer text-onErrorContainer'
      }`}
    >
      <p className="font-semibold">
        {isSizeError ? 'File size limit exceeded' : 'Unable to upload document'}
      </p>
      <p className="mt-1">{message}</p>
    </div>
  )
}

function ProfileStep({
  initialProfile,
  onComplete,
}: {
  initialProfile: CollegeProfileInput
  onComplete: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(collegeProfileSchema),
    defaultValues: initialProfile,
  })

  const [serverError, setServerError] = useState('')

  const onSubmit = async (data: CollegeProfileData) => {
    setServerError('')

    const res = await fetch('/api/college/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) {
      setServerError(json.error || 'Failed to save profile')
      return
    }

    onComplete()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="rounded-xl bg-errorContainer p-4 text-sm text-onErrorContainer">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-onSurface">College name *</label>
        <Input id="name" {...register('name')} placeholder="e.g. IIT Madras" />
        {errors.name && <p className="mt-1 text-xs text-error">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-onSurface">Category *</label>
          <select
            id="category"
            {...register('category')}
            className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
          >
            <option value="">- Select Category -</option>
            {COLLEGE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat.replace('_', ' & ').toUpperCase()}</option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-error">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="collegeType" className="mb-1 block text-sm font-medium text-onSurface">College Type *</label>
          <select
            id="collegeType"
            {...register('collegeType')}
            className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
          >
            <option value="">- Select Type -</option>
            {COLLEGE_TYPES_NEW.map((type) => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
          {errors.collegeType && <p className="mt-1 text-xs text-error">{errors.collegeType.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-onSurface">College type</label>
          <select
            id="type"
            {...register('type')}
            className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
          >
            <option value="">- Select -</option>
            {COLLEGE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-error">{errors.type.message}</p>}
        </div>

        <div>
          <label htmlFor="naacGrade" className="mb-1 block text-sm font-medium text-onSurface">NAAC grade</label>
          <select
            id="naacGrade"
            {...register('naacGrade')}
            className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
          >
            <option value="">- Select -</option>
            {NAAC_GRADES.map((grade) => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          {errors.naacGrade && <p className="mt-1 text-xs text-error">{errors.naacGrade.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className="mb-1 block text-sm font-medium text-onSurface">City</label>
          <Input id="city" {...register('city')} placeholder="e.g. Chennai" />
          {errors.city && <p className="mt-1 text-xs text-error">{errors.city.message}</p>}
        </div>

        <div>
          <label htmlFor="pincode" className="mb-1 block text-sm font-medium text-onSurface">Pincode</label>
          <Input id="pincode" {...register('pincode')} placeholder="e.g. 600036" maxLength={6} />
          {errors.pincode && <p className="mt-1 text-xs text-error">{errors.pincode.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="state" className="mb-1 block text-sm font-medium text-onSurface">State</label>
        <select
          id="state"
          {...register('state')}
          className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
        >
          <option value="">- Select state -</option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
        {errors.state && <p className="mt-1 text-xs text-error">{errors.state.message}</p>}
      </div>

      <div>
        <label htmlFor="affiliation" className="mb-1 block text-sm font-medium text-onSurface">Affiliation body</label>
        <Input id="affiliation" {...register('affiliation')} placeholder="e.g. Anna University" />
        {errors.affiliation && <p className="mt-1 text-xs text-error">{errors.affiliation.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nirfRank" className="mb-1 block text-sm font-medium text-onSurface">NIRF rank</label>
          <Input id="nirfRank" {...register('nirfRank')} type="number" placeholder="e.g. 42" min={1} />
          {errors.nirfRank && <p className="mt-1 text-xs text-error">{errors.nirfRank.message}</p>}
        </div>

        <div>
          <label htmlFor="website" className="mb-1 block text-sm font-medium text-onSurface">Website</label>
          <Input id="website" {...register('website')} type="url" placeholder="https://example.edu.in" />
          {errors.website && <p className="mt-1 text-xs text-error">{errors.website.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="engineeringCutoff" className="mb-1 block text-sm font-medium text-onSurface">Engineering cut-off (out of 200)</label>
          <Input
            id="engineeringCutoff"
            {...register('engineeringCutoff')}
            type="number"
            min={0}
            max={200}
            step="0.01"
            placeholder="e.g. 178.50"
          />
          {errors.engineeringCutoff && <p className="mt-1 text-xs text-error">{errors.engineeringCutoff.message}</p>}
        </div>

        <div>
          <label htmlFor="medicalCutoff" className="mb-1 block text-sm font-medium text-onSurface">Medical cut-off (out of 200)</label>
          <Input
            id="medicalCutoff"
            {...register('medicalCutoff')}
            type="number"
            min={0}
            max={200}
            step="0.01"
            placeholder="e.g. 181.25"
          />
          {errors.medicalCutoff && <p className="mt-1 text-xs text-error">{errors.medicalCutoff.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-onSurface">Description</label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          placeholder="Brief description of your institution..."
          className="w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 py-3 text-base text-onSurface placeholder:text-onSurfaceVariant/60 focus:border-primary focus:outline-none"
        />
        {errors.description && <p className="mt-1 text-xs text-error">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="counsellorEmail" className="mb-1 block text-sm font-medium text-onSurface">Counsellor email</label>
          <Input id="counsellorEmail" {...register('counsellorEmail')} type="email" placeholder="admissions@college.edu.in" />
          {errors.counsellorEmail && <p className="mt-1 text-xs text-error">{errors.counsellorEmail.message}</p>}
        </div>

        <div>
          <label htmlFor="counsellorPhone" className="mb-1 block text-sm font-medium text-onSurface">Counsellor phone</label>
          <Input id="counsellorPhone" {...register('counsellorPhone')} placeholder="9876543210" maxLength={10} />
          {errors.counsellorPhone && <p className="mt-1 text-xs text-error">{errors.counsellorPhone.message}</p>}
        </div>
      </div>

      <Button type="submit" variant="default" className="h-12 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save and Continue'}
      </Button>
    </form>
  )
}

function DocumentStep() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('naac_certificate')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [errorKind, setErrorKind] = useState<UploadErrorKind | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!file) {
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Please upload a file smaller than 10 MB.')
      setErrorKind('size')
      return
    }

    setUploading(true)
    setError('')
    setErrorKind(null)

    try {
      const signRes = await fetch('/api/storage/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      })
      const signData = await signRes.json()
      if (!signRes.ok) {
        throw new Error(signData.error || 'Failed to sign upload')
      }

      const uploadRes = await fetch(signData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage')
      }

      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: documentType, fileName: file.name, storagePath: signData.path }),
      })
      const docData = await docRes.json()
      if (!docRes.ok) {
        throw new Error(docData.error || 'Failed to save document record')
      }

      const verifyRes = await fetch('/api/college/submit-verification', { method: 'POST' })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Failed to submit verification')
      }

      setSuccess(true)
      setFile(null)

      setTimeout(() => {
        router.push(getDashboardPath('college'))
        router.refresh()
      }, 2000)
    } catch (error: unknown) {
      setError(getErrorMessage(error))
      setErrorKind('general')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      <UploadErrorBanner kind={errorKind} message={error} />
      {success && (
        <div className="rounded-xl bg-green-100 p-4 text-sm font-medium text-green-800">
          Document uploaded. Your verification is now pending admin review. Redirecting...
        </div>
      )}

      <div>
        <label htmlFor="documentType" className="mb-1 block text-sm font-medium text-onSurface">
          Document type
        </label>
        <select
          id="documentType"
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as DocumentType)}
          className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
          disabled={uploading || success}
        >
          {verificationDocumentOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <p className="mt-2 text-sm text-onSurfaceVariant">
          Upload at least one accreditation or approval document to submit for verification.
        </p>
      </div>

      <div
        className={`rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
          errorKind === 'size'
            ? 'border-red-500 bg-red-50'
            : 'border-outlineVariant hover:bg-surfaceContainer'
        }`}
      >
        <input
          type="file"
          id="document"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="hidden"
          disabled={uploading || success}
        />
        <label htmlFor="document" className="flex cursor-pointer flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondaryContainer text-onSecondaryContainer">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <span className="mb-1 font-medium text-onSurface">
            {file ? file.name : 'Click to upload or drag and drop'}
          </span>
          <span className="text-sm text-onSurfaceVariant">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, PNG, JPG up to 10 MB'}
          </span>
        </label>
      </div>

      <Button
        type="submit"
        variant="default"
        className="h-12 w-full"
        disabled={!file || uploading || success}
      >
        {uploading ? 'Uploading and Submitting...' : 'Submit for Verification'}
      </Button>
    </form>
  )
}

export function CollegeOnboardingClient({
  initialProfile,
}: {
  initialProfile: CollegeProfileInput
}) {
  const [step, setStep] = useState(1)

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card elevation="elevated" className="border-0">
        <CardHeader>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Onboarding Wizard</p>
          <CardTitle className="text-2xl font-bold text-primary">
            {step === 1 ? 'Complete Your College Profile' : 'Upload Verification Document'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? 'Tell us about your institution before submitting for verification.'
              : 'Upload a document so our admin team can verify your college.'}
          </CardDescription>
          <div className="pt-4">
            <StepIndicator current={step} steps={onboardingSteps} />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1
            ? <ProfileStep initialProfile={initialProfile} onComplete={() => setStep(2)} />
            : <DocumentStep />}
        </CardContent>
      </Card>
    </div>
  )
}
