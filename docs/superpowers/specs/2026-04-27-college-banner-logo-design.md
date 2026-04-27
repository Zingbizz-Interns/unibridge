# College Banner & Logo — Design Spec

**Date:** 2026-04-27  
**Status:** Approved  
**Scope:** Fix overlapping banner/logo hero layout on the public college page; add banner image support; allow college admins to edit logo and banner from both the public page and the settings page.

---

## Problem

The public college profile page (`/colleges/[slug]`) places the college logo with `absolute -top-12 md:-top-16` inside a card, causing it to bleed uncontrolled into the banner area. The banner has no real image — only a gradient. There is no way for college admins to upload or change either the logo or the banner image.

---

## Goals

1. Fix the hero layout to use LinkedIn-style intentional overlap (logo straddles the bottom edge of the banner).
2. Add a `bannerUrl` column to the `colleges` table.
3. Allow college admins to edit the banner and logo via camera icon overlays on the public page (admin-only, visible when `session.user.id === college.userId`).
4. Allow college admins to edit the banner and logo via the College Settings page.
5. Follow Material You (MD3) design system throughout — responsive, with smooth minimal animations.

---

## Database Changes

**File:** `src/db/schema/colleges.ts`

Add one column:
```ts
bannerUrl: text('banner_url'),
```

`logoUrl: text('logo_url')` already exists — no change.

Run after schema edit:
```
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## API Changes

**`src/validators/college-profile.ts`** — add two optional fields:
```ts
logoUrl: z.string().url().optional(),
bannerUrl: z.string().url().optional(),
```

**`src/app/api/college/profile/route.ts`** — no code changes needed; the PATCH handler already spreads validated fields into the Drizzle update.

**`src/app/api/storage/sign-upload/route.ts`** — two small changes required:
1. Add optional `folder` field to `signUploadSchema` (`z.enum(['logos', 'banners']).optional()`), and use it to prefix the storage path: `${folder}/${userId}/${timestamp}-${filename}.{ext}`.
2. Extend `isAllowedContentType` for `publicDocuments` to allow images when `folder` is `logos` or `banners` (currently only PDFs are accepted for that bucket).

Resulting paths:
- Logo: `logos/{userId}/{timestamp}-{filename}.{ext}`
- Banner: `banners/{userId}/{timestamp}-{filename}.{ext}`

**Upload constraints:**
- Max file size: 5 MB
- Accepted types: `image/jpeg`, `image/png`, `image/webp`
- Bucket: `publicDocuments` (`college-public-docs`)

---

## Hero Section Layout Fix

**File:** `src/app/colleges/[slug]/page.tsx`

Replace the current banner + logo markup with a proper LinkedIn-style hero:

```
┌─────────────────────────────────────────┐
│  BANNER (h-40 md:h-56)                  │  ← <img object-cover> or gradient fallback
│  [camera FAB top-right, admin only]     │
└─────────────────────────────────────────┘
     ┌──────────┐
     │   LOGO   │  ← absolute -bottom-12 left-6, 24×24 / 32×32
     │          │  [camera FAB, admin only]
     └──────────┘
┌─────────────────────────────────────────┐
│  pt-16 (clears logo overflow)           │
│  College name, location, etc.           │
└─────────────────────────────────────────┘
```

**Banner container:** `relative h-40 md:h-56 rounded-t-[24px] overflow-hidden`
- If `bannerUrl`: render `<img src={bannerUrl} className="w-full h-full object-cover" />`
- Fallback: existing gradient (`bg-gradient-to-br from-md-primary to-md-tertiary`)
- Organic blur shape overlaid on gradient for MD3 depth (aria-hidden)

**Logo container:** `absolute -bottom-12 left-6` on the banner container
- Size: `h-24 w-24 md:h-32 md:w-32`
- Style: `rounded-[24px] bg-md-surface-container shadow-md border border-md-outline/10`
- Content: `<img object-contain>` if `logoUrl`, else initial letter

**Content section below banner:** starts with `pt-16` to clear the logo overflow.

---

## Admin Edit Overlays — Public Page

**File:** `src/app/colleges/[slug]/page.tsx`

Auth check: `const isAdmin = session?.user?.id === college.userId`

Only render camera overlays when `isAdmin === true`.

**Banner camera FAB:** `absolute top-3 right-3` inside the banner container
- Style: `rounded-full bg-black/40 backdrop-blur-sm text-white h-10 w-10 flex items-center justify-center`
- Hover: `hover:bg-black/60 active:scale-95 transition-all duration-200`
- Hidden `<input type="file" accept="image/*">` triggered on click

**Logo camera FAB:** bottom-right corner of the logo box
- Style: `absolute -bottom-1 -right-1 rounded-full bg-md-tertiary text-white h-8 w-8 flex items-center justify-center shadow-md`
- Hover: `hover:bg-md-tertiary/90 active:scale-95 transition-all duration-200`

**Upload flow (both):**
1. File selected → validate size (≤5 MB) and type
2. Show spinner replacing camera icon
3. POST `/api/storage/sign-upload` with `{ fileName, contentType, size, bucket: 'publicDocuments', path: 'logos/...' or 'banners/...' }`
4. PUT file to signed URL
5. Get public URL via `getStoragePublicUrl()`
6. PATCH `/api/college/profile` with `{ logoUrl }` or `{ bannerUrl }`
7. Swap local state URL → image fades in via `transition-opacity duration-300`
8. On error: show inline error toast, revert spinner to camera icon

---

## Settings Page Image Upload

**File:** `src/app/(protected)/college/settings/CollegeSettingsClient.tsx`

Add a **"Profile Images"** card at the top of the settings form.

**Card style:** `rounded-[24px] bg-md-surface-container p-6 shadow-sm`

**Layout:** Two items side by side on md+, stacked on mobile.

**Banner preview:** `w-full h-20 md:h-28 rounded-[16px] overflow-hidden relative`
- Shows banner image or gradient placeholder
- Camera FAB overlaid at `bottom-2 right-2`

**Logo preview:** `h-24 w-24 rounded-[24px] overflow-hidden relative`
- Shows logo or initial letter fallback
- Camera FAB overlaid at `bottom-0 right-0`

**Upload flow:** Same as public page (sign → PUT → PATCH profile).

**Animations:**
- Image swap: `transition-opacity duration-300` (fade old → new)
- Camera FAB: `active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]`
- Loading spinner replaces camera icon during upload

---

## Material You Design Tokens

All new UI uses existing `md-*` Tailwind tokens already in the project:
- `bg-md-surface-container` — card backgrounds
- `bg-md-primary` / `bg-md-tertiary` — FAB colors
- `text-md-on-surface-variant` — secondary text
- `border-md-outline/10` — subtle borders
- Easing: `cubic-bezier(0.2, 0, 0, 1)` on all transitions
- Radius: `rounded-[24px]` for cards, `rounded-full` for FABs/buttons
- `active:scale-95` on all clickable elements

---

## Responsive Behavior

| Breakpoint | Banner height | Logo size | Layout |
|------------|---------------|-----------|--------|
| Mobile     | `h-40` (160px) | `h-24 w-24` | Single column |
| md+        | `h-56` (224px) | `h-32 w-32` | Two columns in settings |

---

## Accessibility

- Camera overlay buttons: `aria-label="Change banner image"` / `aria-label="Change logo"`
- Decorative blur shapes: `aria-hidden="true"`
- File inputs: `aria-label` matching button
- Focus rings: `focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2`
- `prefers-reduced-motion`: wrap scale/opacity transitions in `motion-safe:` modifier

---

## Files Changed

| File | Change |
|------|--------|
| `src/db/schema/colleges.ts` | Add `bannerUrl` column |
| `src/validators/college-profile.ts` | Add `logoUrl`, `bannerUrl` optional fields |
| `src/app/colleges/[slug]/page.tsx` | Restructure hero, add admin overlays |
| `src/app/(protected)/college/settings/CollegeSettingsClient.tsx` | Add Profile Images card |
| `src/app/api/storage/sign-upload/route.ts` | Add `folder` param; allow images in publicDocuments for logos/banners |
| `drizzle/migrations/` | Generated migration file |

No new API routes. No new packages.
