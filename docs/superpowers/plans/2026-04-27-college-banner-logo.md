# College Banner & Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the overlapping banner/logo hero on `/colleges/[slug]`, add a real banner image field, and let college admins upload/change both the logo and banner from the public page and settings.

**Architecture:** DB gets a `bannerUrl` column. A new `CollegeHeroCard` client component renders the LinkedIn-style hero (banner + overlapping logo) with admin-only camera overlays. Uploads reuse the existing sign-upload → PUT → PATCH profile flow; the sign-upload endpoint gets a small extension to accept a `folder` param and allow images in the `publicDocuments` bucket.

**Tech Stack:** Next.js 15 (App Router), Drizzle ORM, Supabase Storage, Zod, Tailwind CSS (Material You tokens), React hooks

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/db/schema/colleges.ts` | Modify | Add `bannerUrl` column |
| `drizzle/migrations/` | Generated | SQL migration adding `banner_url` |
| `src/validators/college-profile.ts` | Modify | Export `collegeImageSchema` |
| `src/app/api/storage/sign-upload/route.ts` | Modify | Accept `folder` param; allow images in publicDocuments for logos/banners; return `publicUrl` |
| `src/app/api/college/profile/route.ts` | Modify | Handle image-only PATCH via `collegeImageSchema` |
| `src/components/college/CollegeHeroCard.tsx` | Create | Client component — banner + logo display + admin upload overlays |
| `src/app/colleges/[slug]/page.tsx` | Modify | Query `bannerUrl`, compute `isAdmin`, use `CollegeHeroCard` |
| `src/app/(protected)/college/settings/page.tsx` | Modify | Select `logoUrl`, `bannerUrl` from DB |
| `src/app/(protected)/college/settings/CollegeSettingsClient.tsx` | Modify | Add Profile Images card with upload UI |

---

## Task 1: Add `bannerUrl` to DB schema and migrate

**Files:**
- Modify: `src/db/schema/colleges.ts`
- Generated: `drizzle/migrations/<timestamp>_add_banner_url.sql`

- [ ] **Step 1: Add the column after `logoUrl` in the schema**

In `src/db/schema/colleges.ts`, find the `logoUrl` line and add `bannerUrl` directly after it:

```typescript
    logoUrl: text('logo_url'),
    bannerUrl: text('banner_url'),
```

- [ ] **Step 2: Generate the migration**

```bash
npx drizzle-kit generate
```

Expected: A new file appears in `drizzle/migrations/` containing `ALTER TABLE "colleges" ADD COLUMN "banner_url" text;`

- [ ] **Step 3: Apply the migration**

```bash
npx drizzle-kit migrate
```

Expected: `All migrations applied successfully.`

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/colleges.ts drizzle/
git commit -m "feat(db): add banner_url column to colleges table"
```

---

## Task 2: Extend the sign-upload endpoint

**Files:**
- Modify: `src/app/api/storage/sign-upload/route.ts`

- [ ] **Step 1: Replace the file with the updated version**

Replace the entire content of `src/app/api/storage/sign-upload/route.ts` with:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { storageAdmin, storageBuckets } from '@/lib/storage'
import { getStoragePublicUrl } from '@/lib/storage-utils'
import { z } from 'zod'

const maxFileSizeBytes = 10 * 1024 * 1024
const uploadBuckets = ['verification', 'publicDocuments', 'stories'] as const
type UploadBucketKey = (typeof uploadBuckets)[number]

const signUploadSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  contentType: z.string().trim().min(1, 'Content type is required'),
  size: z.number().int().positive().max(maxFileSizeBytes).optional(),
  bucket: z.enum(uploadBuckets).default('verification'),
  folder: z.enum(['logos', 'banners']).optional(),
})

function isAllowedContentType(
  contentType: string,
  bucket: UploadBucketKey,
  folder?: string
) {
  switch (bucket) {
    case 'publicDocuments':
      if (folder === 'logos' || folder === 'banners') {
        return contentType.startsWith('image/')
      }
      return contentType === 'application/pdf'
    case 'stories':
      return contentType.startsWith('image/')
    case 'verification':
    default:
      return contentType === 'application/pdf' || contentType.startsWith('image/')
  }
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName, contentType, bucket, folder } = signUploadSchema.parse(await req.json())

    if (!isAllowedContentType(contentType, bucket, folder)) {
      const message =
        bucket === 'publicDocuments' && !folder
          ? 'Invalid file type. Only PDFs are allowed.'
          : bucket === 'stories' || folder
            ? 'Invalid file type. Only images are allowed.'
            : 'Invalid file type. Only PDFs and images are allowed.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const bucketName = storageBuckets[bucket]
    const fileExt = fileName.split('.').pop() || 'bin'
    const baseName = sanitizeFileName(fileName.replace(/\.[^.]+$/, '')) || 'upload'
    const pathSegments = [
      ...(folder ? [folder] : []),
      session.user.id,
      `${Date.now()}-${baseName}.${fileExt}`,
    ]
    const path = pathSegments.join('/')

    const { data, error } = await storageAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(path)

    if (error) {
      console.error('Supabase signed URL error:', error)
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      token: data.token,
      bucket: bucketName,
      publicUrl: getStoragePublicUrl(bucketName, path),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid upload request' },
        { status: 400 }
      )
    }

    console.error('Storage sign upload error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/storage/sign-upload/route.ts
git commit -m "feat(api): extend sign-upload to support image folders and return publicUrl"
```

---

## Task 3: Add `collegeImageSchema` and update profile PATCH route

**Files:**
- Modify: `src/validators/college-profile.ts`
- Modify: `src/app/api/college/profile/route.ts`

- [ ] **Step 1: Add `collegeImageSchema` at the bottom of the validators file**

Open `src/validators/college-profile.ts`. After the last export (`export type CollegeProfileData = ...`), add:

```typescript
export const collegeImageSchema = z.object({
  logoUrl: z.string().url('Must be a valid URL').nullable().optional(),
  bannerUrl: z.string().url('Must be a valid URL').nullable().optional(),
})

export type CollegeImageData = z.infer<typeof collegeImageSchema>
```

- [ ] **Step 2: Update the PATCH route to handle image-only updates**

Replace the entire content of `src/app/api/college/profile/route.ts` with:

```typescript
import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { colleges } from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { collegeProfileSchema, collegeImageSchema } from '@/validators/college-profile'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const college = await db.query.colleges.findFirst({
      where: eq(colleges.userId, session.user.id),
      columns: { id: true },
    })

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    // Image-only update: body has no `name` field
    if (!('name' in body)) {
      const { logoUrl, bannerUrl } = collegeImageSchema.parse(body)
      await db
        .update(colleges)
        .set({
          ...(logoUrl !== undefined && { logoUrl: logoUrl ?? null }),
          ...(bannerUrl !== undefined && { bannerUrl: bannerUrl ?? null }),
        })
        .where(eq(colleges.id, college.id))
      return NextResponse.json({ success: true })
    }

    // Full profile update
    const data = collegeProfileSchema.parse(body)

    await db
      .update(colleges)
      .set({
        name: data.name,
        category: data.category ?? null,
        collegeType: data.collegeType ?? null,
        type: data.type ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        pincode: data.pincode ?? null,
        affiliation: data.affiliation ?? null,
        naacGrade: data.naacGrade ?? null,
        nirfRank: data.nirfRank ?? null,
        engineeringCutoff:
          data.engineeringCutoff !== undefined ? String(data.engineeringCutoff) : null,
        medicalCutoff:
          data.medicalCutoff !== undefined ? String(data.medicalCutoff) : null,
        website: data.website ?? null,
        description: data.description ?? null,
        counsellorEmail: data.counsellorEmail ?? null,
        counsellorPhone: data.counsellorPhone ?? null,
        location:
          data.latitude !== undefined && data.longitude !== undefined
            ? sql`ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`
            : null,
      })
      .where(eq(colleges.id, college.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('College profile update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/validators/college-profile.ts src/app/api/college/profile/route.ts
git commit -m "feat(api): add image-only PATCH path for college logo and banner"
```

---

## Task 4: Create `CollegeHeroCard` client component

**Files:**
- Create: `src/components/college/CollegeHeroCard.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/college/CollegeHeroCard.tsx` with this content:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/college/CollegeHeroCard.tsx
git commit -m "feat(ui): add CollegeHeroCard client component with banner/logo + admin upload overlays"
```

---

## Task 5: Update the public college page to use `CollegeHeroCard`

**Files:**
- Modify: `src/app/colleges/[slug]/page.tsx`

- [ ] **Step 1: Add `CollegeHeroCard` import at the top of the file**

After the existing imports, add:

```typescript
import { CollegeHeroCard } from '@/components/college/CollegeHeroCard'
```

- [ ] **Step 2: Add `bannerUrl` to the college DB query**

Find:
```typescript
  const c = await db.query.colleges.findFirst({
    where: eq(colleges.slug, slug)
  })
```

Replace with:
```typescript
  const c = await db.query.colleges.findFirst({
    where: eq(colleges.slug, slug),
    columns: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      city: true,
      state: true,
      category: true,
      collegeType: true,
      type: true,
      nirfRank: true,
      naacGrade: true,
      engineeringCutoff: true,
      medicalCutoff: true,
      affiliation: true,
      website: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      verificationStatus: true,
      counsellorName: true,
      counsellorEmail: true,
      counsellorPhone: true,
    },
  })
```

- [ ] **Step 3: Compute `isAdmin` after the user fetch**

Find the lines:
```typescript
  let isShortlisted = false
  let existingApplicationId: string | null = null
  let studentPhone: string | null = null
```

Add one line before them:
```typescript
  const isAdmin = user?.role === 'college' && user.id === c.userId
```

- [ ] **Step 4: Replace the hero card JSX**

Find and remove this entire block (the hero Card):
```typescript
      {/* Hero card */}
      <Card className="overflow-hidden mb-8">
        <div className="bg-gradient-to-br from-md-primary to-md-tertiary h-32 md:h-48 relative">
          <div className="absolute inset-0 bg-md-primary/20 blur-3xl" aria-hidden="true" />
        </div>
        <div className="px-6 pb-6 relative">
          <div className="h-24 w-24 md:h-32 md:w-32 bg-md-surface rounded-3xl shadow-md border border-md-outline/10 flex items-center justify-center p-2 absolute -top-12 md:-top-16">
            {c.logoUrl ? (
              <img src={c.logoUrl} alt={c.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-md-on-surface-variant font-bold text-3xl">{c.name.charAt(0)}</div>
            )}
          </div>

          <div className="mt-16 md:mt-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-md-on-surface">{c.name}</h1>
              <p className="text-md-on-surface-variant mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {formatLocation(c.city, c.state)}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {!user || user.role === 'student' ? (
                existingApplicationId ? (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/applications/${existingApplicationId}`}>View Application</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={`/apply/${c.id}`}>Apply Now</Link>
                  </Button>
                )
              ) : null}
              <CompareToggleButton
                college={{ id: c.id, name: c.name, slug: c.slug }}
              />
              <ShortlistButton collegeId={c.id} initialIsShortlisted={isShortlisted} />
              {website ? (
                <Button variant="outline" asChild>
                  <a href={website.href} target="_blank" rel="noreferrer">Visit Website</a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
```

Replace it with:
```typescript
      {/* Hero card */}
      <Card className="overflow-hidden mb-8">
        <CollegeHeroCard
          college={{ name: c.name, logoUrl: c.logoUrl ?? null, bannerUrl: c.bannerUrl ?? null }}
          isAdmin={isAdmin}
        />
        <div className="px-6 pb-6 pt-16 md:pt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-md-on-surface">{c.name}</h1>
              <p className="text-md-on-surface-variant mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {formatLocation(c.city, c.state)}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {!user || user.role === 'student' ? (
                existingApplicationId ? (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/applications/${existingApplicationId}`}>View Application</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={`/apply/${c.id}`}>Apply Now</Link>
                  </Button>
                )
              ) : null}
              <CompareToggleButton
                college={{ id: c.id, name: c.name, slug: c.slug }}
              />
              <ShortlistButton collegeId={c.id} initialIsShortlisted={isShortlisted} />
              {website ? (
                <Button variant="outline" asChild>
                  <a href={website.href} target="_blank" rel="noreferrer">Visit Website</a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
```

- [ ] **Step 5: Commit**

```bash
git add src/app/colleges/[slug]/page.tsx
git commit -m "feat(ui): replace hero markup with CollegeHeroCard, fix banner/logo overlap"
```

---

## Task 6: Update settings page server component to pass image URLs

**Files:**
- Modify: `src/app/(protected)/college/settings/page.tsx`

- [ ] **Step 1: Add `logoUrl` and `bannerUrl` to the DB select**

In `src/app/(protected)/college/settings/page.tsx`, find the select object inside `.select({...})`. It currently ends with `longitude: sql<...>`. Add two fields right after `verificationStatus`:

```typescript
      logoUrl: colleges.logoUrl,
      bannerUrl: colleges.bannerUrl,
```

The updated select block (showing context around the additions):

```typescript
  const [college] = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      category: colleges.category,
      collegeType: colleges.collegeType,
      type: colleges.type,
      city: colleges.city,
      state: colleges.state,
      pincode: colleges.pincode,
      affiliation: colleges.affiliation,
      naacGrade: colleges.naacGrade,
      nirfRank: colleges.nirfRank,
      engineeringCutoff: colleges.engineeringCutoff,
      medicalCutoff: colleges.medicalCutoff,
      website: colleges.website,
      description: colleges.description,
      counsellorEmail: colleges.counsellorEmail,
      counsellorPhone: colleges.counsellorPhone,
      verificationStatus: colleges.verificationStatus,
      logoUrl: colleges.logoUrl,
      bannerUrl: colleges.bannerUrl,
      latitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_Y(${colleges.location}) END`,
      longitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_X(${colleges.location}) END`,
    })
    .from(colleges)
    .where(eq(colleges.userId, user.id))
    .limit(1)
```

The `collegeForClient` spread (`...college`) will automatically include `logoUrl` and `bannerUrl` — no additional changes needed there.

- [ ] **Step 2: Commit**

```bash
git add src/app/(protected)/college/settings/page.tsx
git commit -m "feat(settings): pass logoUrl and bannerUrl to CollegeSettingsClient"
```

---

## Task 7: Add Profile Images card to `CollegeSettingsClient`

**Files:**
- Modify: `src/app/(protected)/college/settings/CollegeSettingsClient.tsx`

- [ ] **Step 1: Update the Props type to include image URLs**

Find the `Props` type in `CollegeSettingsClient.tsx`. The `college` object inside it currently ends with `verificationStatus`. Add two fields:

```typescript
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
```

- [ ] **Step 2: Add image state and upload handler after existing state declarations**

Find the line:
```typescript
  const isRejected = verificationStatus === 'rejected'
```

Add this block directly after it:

```typescript
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
```

- [ ] **Step 3: Add `useRef` to imports**

Find the import line:
```typescript
import { useState } from 'react'
```

Replace with:
```typescript
import { useRef, useState } from 'react'
```

- [ ] **Step 4: Add the Profile Images card as the first card in the JSX return**

Find the JSX return (line ~250):
```typescript
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12 sm:px-6 animate-page-enter">
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">College Profile</CardTitle>
```

Insert the Profile Images card immediately inside the wrapper div, before the existing `<Card elevation="elevated">` for College Profile:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(protected)/college/settings/CollegeSettingsClient.tsx
git commit -m "feat(settings): add Profile Images card with banner and logo upload"
```

---

## Self-Review Notes

- **Spec coverage:** All 5 spec sections covered: DB (Task 1), sign-upload extension (Task 2), API (Task 3), hero layout fix (Tasks 4+5), settings upload (Tasks 6+7).
- **Type consistency:** `logoUrl`/`bannerUrl` are `string | null` throughout. `collegeImageSchema` uses `.nullable().optional()`. The `Props` in `CollegeSettingsClient` explicitly types both.  
- **`publicDocuments` bucket public access:** The banner and logo images are stored in the same bucket used for public college documents. Ensure this bucket is configured as **public** in Supabase (Storage → Buckets → `college-public-docs` → Public toggle). If it's currently private, `getStoragePublicUrl` will return a URL that 403s. Verify in Supabase dashboard before testing.
- **`bannerUrl` might be `undefined` (not in Drizzle inferred type yet):** After Task 1 migration, restart the dev server so Drizzle picks up the new schema type.
