'use client'

import { useRef, useState } from 'react'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type Props = {
  college: {
    name: string
    logoUrl: string | null
    bannerUrl: string | null
  }
  isAdmin: boolean
}

async function uploadCollegeImage(file: File, folder: 'logos' | 'banners'): Promise<string> {
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

  if (!signRes.ok) {
    const { error } = await signRes.json()
    throw new Error(error ?? 'Failed to get upload URL')
  }

  const { signedUrl, publicUrl } = await signRes.json()

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!uploadRes.ok) throw new Error('Upload to storage failed')

  return publicUrl as string
}

async function saveImageUrl(field: 'logoUrl' | 'bannerUrl', url: string): Promise<void> {
  const res = await fetch('/api/college/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: url }),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? 'Failed to save image URL')
  }
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function CollegeHeroCard({ college, isAdmin }: Props) {
  const [logoUrl, setLogoUrl] = useState(college.logoUrl)
  const [bannerUrl, setBannerUrl] = useState(college.bannerUrl)
  const [logoLoading, setLogoLoading] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  async function handleImageChange(
    file: File,
    folder: 'logos' | 'banners',
    field: 'logoUrl' | 'bannerUrl',
    setUrl: (url: string) => void,
    setLoading: (b: boolean) => void
  ) {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be under 5 MB.')
      return
    }

    setLoading(true)
    try {
      const publicUrl = await uploadCollegeImage(file, folder)
      await saveImageUrl(field, publicUrl)
      setUrl(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Banner */}
      <div className="relative h-40 md:h-56">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            role="presentation"
            className="h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-300"
          />
        ) : (
          <div
            className="h-full w-full bg-gradient-to-br from-md-primary to-md-tertiary"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-md-primary/20 blur-3xl" aria-hidden="true" />
          </div>
        )}

        {isAdmin && (
          <>
            <button
              type="button"
              aria-label="Change banner image"
              onClick={() => bannerInputRef.current?.click()}
              disabled={bannerLoading}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm motion-safe:transition-all motion-safe:duration-200 hover:bg-black/60 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bannerLoading ? <Spinner className="h-4 w-4" /> : <CameraIcon className="h-4 w-4" />}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Change banner image file"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImageChange(file, 'banners', 'bannerUrl', setBannerUrl, setBannerLoading)
                }
                e.target.value = ''
              }}
            />
          </>
        )}

        {/* Logo — straddles bottom edge of banner */}
        <div className="absolute -bottom-12 left-6 md:-bottom-16">
          <div className="relative h-24 w-24 md:h-32 md:w-32">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[24px] border border-md-outline/10 bg-md-surface-container shadow-md">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={college.name}
                  className="max-h-full max-w-full object-contain motion-safe:transition-opacity motion-safe:duration-300"
                />
              ) : (
                <span className="text-3xl font-bold text-md-on-surface-variant" aria-hidden="true">
                  {college.name.charAt(0)}
                </span>
              )}
            </div>

            {isAdmin && (
              <>
                <button
                  type="button"
                  aria-label="Change logo"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoLoading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-md-tertiary text-white shadow-md motion-safe:transition-all motion-safe:duration-200 hover:bg-md-tertiary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {logoLoading ? <Spinner className="h-3.5 w-3.5" /> : <CameraIcon className="h-3.5 w-3.5" />}
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Change logo file"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageChange(file, 'logos', 'logoUrl', setLogoUrl, setLogoLoading)
                    }
                    e.target.value = ''
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div
          role="alert"
          className="mx-6 mt-3 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700 motion-safe:animate-fade-in"
        >
          {error}
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}
