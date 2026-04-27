// src/app/(protected)/college/settings/CollegeSettingsClient.tsx
'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatDocumentTypeLabel, verificationDocumentOptions } from '@/lib/college-content'
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

type ExistingDoc = {
  id: string
  type: string
  fileName: string | null
}

type Props = {
  college: {
    name: string
    category: string | null
    collegeType: string | null
    type: string | null
    city: string | null
    state: string | null
    pincode: string | null
    affiliation: string | null
    naacGrade: string | null
    nirfRank: number | null
    engineeringCutoff: number | null
    medicalCutoff: number | null
    website: string | null
    description: string | null
    counsellorEmail: string | null
    counsellorPhone: string | null
    latitude: number | null
    longitude: number | null
    verificationStatus: 'pending' | 'approved' | 'rejected' | 'suspended'
    logoUrl: string | null
    bannerUrl: string | null
  }
  documents: ExistingDoc[]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred'
}

export function CollegeSettingsClient({ college, documents: initialDocs }: Props) {
  const router = useRouter()

  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')

  const [documents, setDocuments] = useState(initialDocs)
  const [verificationStatus, setVerificationStatus] = useState(college.verificationStatus)
  const [uploadError, setUploadError] = useState('')
  const [uploadErrorKind, setUploadErrorKind] = useState<UploadErrorKind | null>(null)
  const [newDocUploaded, setNewDocUploaded] = useState(false)
  const [newDocFile, setNewDocFile] = useState<File | null>(null)
  const [newDocType, setNewDocType] = useState<DocumentType>('naac_certificate')
  const [uploading, setUploading] = useState(false)

  const [resubmitting, setResubmitting] = useState(false)
  const [resubmitSuccess, setResubmitSuccess] = useState(false)
  const [resubmitError, setResubmitError] = useState('')

  const defaultValues: CollegeProfileInput = {
    name: college.name,
    category: (college.category ?? undefined) as CollegeProfileInput['category'],
    collegeType: (college.collegeType ?? undefined) as CollegeProfileInput['collegeType'],
    type: (college.type ?? undefined) as CollegeProfileInput['type'],
    city: college.city ?? '',
    state: (college.state ?? undefined) as CollegeProfileInput['state'],
    pincode: college.pincode ?? '',
    affiliation: college.affiliation ?? '',
    naacGrade: (college.naacGrade ?? undefined) as CollegeProfileInput['naacGrade'],
    nirfRank: college.nirfRank ?? undefined,
    engineeringCutoff: college.engineeringCutoff ?? undefined,
    medicalCutoff: college.medicalCutoff ?? undefined,
    website: college.website ?? '',
    description: college.description ?? '',
    counsellorEmail: college.counsellorEmail ?? '',
    counsellorPhone: college.counsellorPhone ?? '',
    latitude: college.latitude ?? undefined,
    longitude: college.longitude ?? undefined,
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(collegeProfileSchema),
    defaultValues,
  })

  const isRejected = verificationStatus === 'rejected'

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  const [logoUrl, setLogoUrl] = useState<string | null>(college.logoUrl)
  const [bannerUrl, setBannerUrl] = useState<string | null>(college.bannerUrl)
  const [logoUploading, setLogoUploading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [imageError, setImageError] = useState('')

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(
    file: File,
    folder: 'logos' | 'banners',
    field: 'logoUrl' | 'bannerUrl',
    setUrl: (url: string) => void,
    setUploading: (b: boolean) => void
  ) {
    setImageError('')

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must be under 5 MB.')
      return
    }

    setUploading(true)
    try {
      const signRes = await fetch('/api/storage/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          bucket: 'publicDocuments',
          folder,
        }),
      })

      const signData = await signRes.json()
      if (!signRes.ok) throw new Error(signData.error ?? 'Failed to get upload URL')

      const uploadRes = await fetch(signData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload to storage failed')

      const patchRes = await fetch('/api/college/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: signData.publicUrl }),
      })
      if (!patchRes.ok) {
        const patchData = await patchRes.json()
        throw new Error(patchData.error ?? 'Failed to save image')
      }

      setUrl(signData.publicUrl as string)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function submitVerification() {
    const res = await fetch('/api/college/submit-verification', { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Failed to submit verification')
    }

    setVerificationStatus('pending')
    setResubmitSuccess(true)
    setResubmitError('')
    router.refresh()
  }

  const onProfileSubmit = async (data: CollegeProfileData) => {
    setProfileError('')
    setProfileSuccess(false)

    const res = await fetch('/api/college/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()
    if (!res.ok) {
      setProfileError(json.error || 'Failed to save profile')
      return
    }

    setProfileSuccess(true)
    router.refresh()
  }

  const handleDocUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newDocFile) {
      return
    }

    if (newDocFile.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File must be smaller than 10 MB.')
      setUploadErrorKind('size')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadErrorKind(null)
    setNewDocUploaded(false)
    setResubmitSuccess(false)
    setResubmitError('')

    try {
      const signRes = await fetch('/api/storage/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: newDocFile.name,
          contentType: newDocFile.type,
          size: newDocFile.size,
        }),
      })
      const signData = await signRes.json()
      if (!signRes.ok) {
        throw new Error(signData.error || 'Failed to sign upload')
      }

      const uploadRes = await fetch(signData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': newDocFile.type },
        body: newDocFile,
      })
      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage')
      }

      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newDocType,
          fileName: newDocFile.name,
          storagePath: signData.path,
        }),
      })
      const docData = await docRes.json()
      if (!docRes.ok) {
        throw new Error(docData.error || 'Failed to save document record')
      }

      const savedDoc = docData.document as ExistingDoc
      setDocuments((currentDocs) => [
        savedDoc,
        ...currentDocs.filter((doc) => doc.type !== savedDoc.type),
      ])
      setNewDocUploaded(true)
      setNewDocFile(null)

      if (verificationStatus === 'rejected') {
        setResubmitting(true)

        try {
          await submitVerification()
        } finally {
          setResubmitting(false)
        }
      } else {
        router.refresh()
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error)
      setUploadError(message)
      setUploadErrorKind('general')

      if (newDocUploaded || verificationStatus === 'rejected') {
        setResubmitError('Document uploaded, but automatic re-submission did not complete. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleResubmit = async () => {
    setResubmitting(true)
    setResubmitError('')

    try {
      await submitVerification()
    } catch (error: unknown) {
      setResubmitError(getErrorMessage(error))
    } finally {
      setResubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6 animate-page-enter">

      {/* Profile Images */}
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-primary">Profile Images</CardTitle>
          <CardDescription>Upload your college logo and banner. JPEG, PNG, or WebP · max 5 MB each.</CardDescription>
        </CardHeader>
        <CardContent>
          {imageError && (
            <div className="mb-4 rounded-xl bg-errorContainer p-3 text-sm text-onErrorContainer">
              {imageError}
            </div>
          )}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Banner */}
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium text-onSurface">Banner</p>
              <div className="relative h-28 w-full overflow-hidden rounded-[16px]">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="College banner"
                    className="h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-300"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-md-primary to-md-tertiary" />
                )}
                <button
                  type="button"
                  aria-label="Change banner image"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm motion-safe:transition-all motion-safe:duration-200 hover:bg-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bannerUploading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Change banner image file"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'banners', 'bannerUrl', setBannerUrl, setBannerUploading)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>

            {/* Logo */}
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium text-onSurface">Logo</p>
              <div className="relative h-24 w-24">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[20px] border border-outlineVariant bg-surfaceContainerLow shadow-sm">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="College logo"
                      className="max-h-full max-w-full object-contain motion-safe:transition-opacity motion-safe:duration-300"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-onSurfaceVariant" aria-hidden="true">
                      {college.name.charAt(0)}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Change logo"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-md-tertiary text-white shadow-md motion-safe:transition-all motion-safe:duration-200 hover:bg-md-tertiary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {logoUploading ? (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Change logo file"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'logos', 'logoUrl', setLogoUrl, setLogoUploading)
                    e.target.value = ''
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">College Profile</CardTitle>
          <CardDescription>Update your institution details.</CardDescription>
        </CardHeader>
        <CardContent>
          {profileError && (
            <div className="mb-4 rounded-xl bg-errorContainer p-4 text-sm text-onErrorContainer">
              {profileError}
            </div>
          )}
          {profileSuccess && (
            <div className="mb-4 rounded-xl bg-green-100 p-4 text-sm font-medium text-green-800">
              Profile updated successfully.
            </div>
          )}

          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-onSurface">College name *</label>
              <Input id="name" {...register('name')} />
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
                <label htmlFor="type" className="mb-1 block text-sm font-medium text-onSurface">College type (Legacy)</label>
                <select
                  id="type"
                  {...register('type')}
                  className="h-14 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
                >
                  <option value="">- Select -</option>
                  {COLLEGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
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
                  {NAAC_GRADES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                </select>
                {errors.naacGrade && <p className="mt-1 text-xs text-error">{errors.naacGrade.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-onSurface">City</label>
                <Input id="city" {...register('city')} />
                {errors.city && <p className="mt-1 text-xs text-error">{errors.city.message}</p>}
              </div>
              <div>
                <label htmlFor="pincode" className="mb-1 block text-sm font-medium text-onSurface">Pincode</label>
                <Input id="pincode" {...register('pincode')} maxLength={6} />
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
                {INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-error">{errors.state.message}</p>}
            </div>

            <div>
              <label htmlFor="affiliation" className="mb-1 block text-sm font-medium text-onSurface">Affiliation body</label>
              <Input id="affiliation" {...register('affiliation')} />
              {errors.affiliation && <p className="mt-1 text-xs text-error">{errors.affiliation.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="nirfRank" className="mb-1 block text-sm font-medium text-onSurface">NIRF rank</label>
                <Input id="nirfRank" {...register('nirfRank')} type="number" min={1} />
                {errors.nirfRank && <p className="mt-1 text-xs text-error">{errors.nirfRank.message}</p>}
              </div>
              <div>
                <label htmlFor="website" className="mb-1 block text-sm font-medium text-onSurface">Website</label>
                <Input id="website" {...register('website')} type="url" />
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
                className="w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 py-3 text-base text-onSurface placeholder:text-onSurfaceVariant/60 focus:border-primary focus:outline-none"
              />
              {errors.description && <p className="mt-1 text-xs text-error">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="counsellorEmail" className="mb-1 block text-sm font-medium text-onSurface">Counsellor email</label>
                <Input id="counsellorEmail" {...register('counsellorEmail')} type="email" />
                {errors.counsellorEmail && <p className="mt-1 text-xs text-error">{errors.counsellorEmail.message}</p>}
              </div>
              <div>
                <label htmlFor="counsellorPhone" className="mb-1 block text-sm font-medium text-onSurface">Counsellor phone</label>
                <Input id="counsellorPhone" {...register('counsellorPhone')} maxLength={10} />
                {errors.counsellorPhone && <p className="mt-1 text-xs text-error">{errors.counsellorPhone.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="latitude" className="mb-1 block text-sm font-medium text-onSurface">Latitude</label>
                <Input id="latitude" {...register('latitude')} type="number" step="any" />
                {errors.latitude && <p className="mt-1 text-xs text-error">{errors.latitude.message}</p>}
              </div>
              <div>
                <label htmlFor="longitude" className="mb-1 block text-sm font-medium text-onSurface">Longitude</label>
                <Input id="longitude" {...register('longitude')} type="number" step="any" />
                {errors.longitude && <p className="mt-1 text-xs text-error">{errors.longitude.message}</p>}
              </div>
            </div>

            <Button type="submit" variant="default" className="h-12 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-onSurface">Verification Documents</CardTitle>
          <CardDescription>
            {isRejected
              ? 'Your registration was rejected. Re-upload a document to move your college back into the pending review queue.'
              : verificationStatus === 'suspended'
                ? 'Your listing is currently suspended from public discovery. Contact the admin team or upload refreshed documents if asked to do so.'
              : verificationStatus === 'pending'
                ? 'Your documents are under admin review.'
                : 'Documents submitted for verification.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-outlineVariant bg-surfaceContainer p-3"
                >
                  <span className="shrink-0 rounded-full bg-secondaryContainer px-2 py-0.5 text-xs font-medium uppercase text-onSurfaceVariant">
                    {formatDocumentTypeLabel(doc.type)}
                  </span>
                  <span className="truncate text-sm text-onSurface">
                    {doc.fileName || formatDocumentTypeLabel(doc.type)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                uploadErrorKind === 'size'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-transparent bg-errorContainer text-onErrorContainer'
              }`}
            >
              <p className="font-semibold">
                {uploadErrorKind === 'size' ? 'File size limit exceeded' : 'Unable to upload document'}
              </p>
              <p className="mt-1">{uploadError}</p>
            </div>
          )}

          {newDocUploaded && !resubmitSuccess && (
            <div className="rounded-xl bg-green-100 p-3 text-sm font-medium text-green-800">
              New document uploaded successfully.
            </div>
          )}

          {resubmitSuccess && (
            <div className="rounded-xl bg-green-100 p-3 text-sm font-medium text-green-800">
              Your updated documents are back in the pending review queue.
            </div>
          )}

          <form onSubmit={handleDocUpload} className="space-y-4 pt-2">
            <h4 className="text-sm font-medium uppercase tracking-wide text-onSurfaceVariant">
              Upload new document
            </h4>

            <div>
              <label htmlFor="newDocType" className="mb-1 block text-sm font-medium text-onSurface">Document type</label>
              <select
                id="newDocType"
                value={newDocType}
                onChange={(event) => setNewDocType(event.target.value as DocumentType)}
                className="h-12 w-full rounded-t-lg border-b-2 border-outlineVariant bg-surfaceContainerLow px-4 text-onSurface focus:border-primary focus:outline-none"
                disabled={uploading}
              >
                {verificationDocumentOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div
              className={`rounded-2xl border-2 border-dashed p-5 text-center ${
                uploadErrorKind === 'size'
                  ? 'border-red-500 bg-red-50'
                  : 'border-outlineVariant'
              }`}
            >
              <input
                type="file"
                id="newDoc"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) => setNewDocFile(event.target.files?.[0] || null)}
                className="hidden"
                disabled={uploading}
              />
              <label htmlFor="newDoc" className="flex cursor-pointer flex-col items-center gap-1">
                <span className="text-sm font-medium text-onSurface">
                  {newDocFile ? newDocFile.name : 'Click to select file'}
                </span>
                <span className="text-xs text-onSurfaceVariant">PDF, PNG, JPG up to 10 MB</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={!newDocFile || uploading || resubmitting}
            >
              {uploading
                ? 'Uploading...'
                : isRejected
                  ? 'Upload and Re-submit'
                  : 'Upload Document'}
            </Button>
          </form>

          {isRejected && (
            <div className="space-y-3 border-t border-outlineVariant pt-4">
              {resubmitError && (
                <div className="rounded-xl bg-errorContainer p-3 text-sm text-onErrorContainer">
                  {resubmitError}
                </div>
              )}
              <Button
                variant="default"
                className="h-12 w-full"
                onClick={handleResubmit}
                disabled={documents.length === 0 || resubmitting || uploading}
              >
                {resubmitting ? 'Submitting...' : 'Retry Pending Submission'}
              </Button>
              {documents.length === 0 && (
                <p className="text-center text-xs text-onSurfaceVariant">
                  Upload at least one document above to enable re-submission.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
