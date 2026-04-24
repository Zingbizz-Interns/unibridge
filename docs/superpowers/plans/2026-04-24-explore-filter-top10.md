# Explore Page Filter Fix + Top 10 Table — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix stream-based filtering on `/colleges` (0 results bug), expand seed data to 66 colleges across 6 streams, add an animated Top 10 ranking table that replaces the card grid when a stream/goal is active.

**Architecture:** All changes stay server-rendered (Next.js App Router + Drizzle inline queries). A `STREAM_CATEGORY_MAP` constant maps goal stream names (e.g., "Engineering") to the `college_category` enum, injecting a direct `eq(colleges.category, ...)` condition instead of the broken ILIKE course subquery. Unmapped streams (Management, Commerce, Law) keep the existing ILIKE approach. The `Top10Table` is extracted into `_components/Top10Table.tsx` and rendered in place of the card grid when `streams.length > 0`.

**Tech Stack:** Next.js 14 App Router · Drizzle ORM · Neon PostgreSQL · Tailwind CSS · TypeScript · tsx (seed script)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/globals.css` | Modify | Add `slideUp` + `fadeIn` CSS keyframes and utility classes |
| `src/components/home/StudyGoalSection.tsx` | Modify | Change all 6 goal hrefs to `?stream=<name>` |
| `src/app/colleges/page.tsx` | Modify | Add `STREAM_CATEGORY_MAP`, fix filter logic, add cutoff fields to select, update hero chips, force NIRF sort when stream active, render Top10Table branch |
| `src/app/colleges/_components/Top10Table.tsx` | Create | Self-contained Top 10 ranking table with staggered row animations |
| `src/scripts/seed-demo-colleges.ts` | Modify | Expand to 66 colleges across Engineering, Medical, Arts & Science, Management, Commerce, Law |

---

### Task 1: Add CSS animation keyframes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Append keyframes and utility classes to the end of globals.css**

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.animate-fade-in {
  animation: fadeIn 0.35s ease both;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add slide-up and fade-in CSS animations"
```

---

### Task 2: Update home-page goal routing

**Files:**
- Modify: `src/components/home/StudyGoalSection.tsx`

- [ ] **Step 1: Replace the `goals` array**

Replace the entire `goals` array (the `const goals = [...]` block) with:

```ts
const goals: {
  Icon: LucideIcon
  title: string
  subtitle: string
  courses: string[]
  bg: string
  iconColor: string
  href: string
}[] = [
  {
    Icon: Cog,
    title: 'Engineering',
    subtitle: '6,368 Colleges',
    courses: ['BE/B.Tech', 'ME/M.Tech', 'Diploma'],
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    href: '/colleges?stream=Engineering',
  },
  {
    Icon: Briefcase,
    title: 'Management',
    subtitle: '4,512 Colleges',
    courses: ['MBA', 'BBA', 'PGDM'],
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    href: '/colleges?stream=Management',
  },
  {
    Icon: BarChart2,
    title: 'Commerce',
    subtitle: '3,200 Colleges',
    courses: ['B.Com', 'M.Com', 'CA'],
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    href: '/colleges?stream=Commerce',
  },
  {
    Icon: Palette,
    title: 'Arts',
    subtitle: '2,890 Colleges',
    courses: ['BA', 'MA', 'BFA'],
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    href: '/colleges?stream=Arts+%26+Science',
  },
  {
    Icon: HeartPulse,
    title: 'Medical',
    subtitle: '1,850 Colleges',
    courses: ['MBBS', 'BDS', 'BAMS'],
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    href: '/colleges?stream=Medical',
  },
  {
    Icon: Scale,
    title: 'Law',
    subtitle: '980 Colleges',
    courses: ['LLB', 'BA LLB', 'LLM'],
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    href: '/colleges?stream=Law',
  },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/components/home/StudyGoalSection.tsx
git commit -m "feat: update goal cards to use stream-based routing"
```

---

### Task 3: Fix filter logic in page.tsx

**Files:**
- Modify: `src/app/colleges/page.tsx`

- [ ] **Step 1: Add `STREAM_CATEGORY_MAP` constant**

After the `normalizeCollegeType` function (around line 46), insert:

```ts
const STREAM_CATEGORY_MAP: Partial<Record<string, (typeof categoryEnum.enumValues)[number]>> = {
  engineering:          'engineering',
  medical:              'medical',
  'arts & science':     'arts_science',
  'arts and science':   'arts_science',
  arts_science:         'arts_science',
}
```

- [ ] **Step 2: Split streams into mapped and unmapped, and force NIRF sort**

Find:
```ts
const streams = readArrayParam(params, 'stream')
```

Replace with:
```ts
const streams = readArrayParam(params, 'stream')

const mappedStreamCategories = [
  ...new Set(
    streams
      .map((s) => STREAM_CATEGORY_MAP[s.toLowerCase()])
      .filter((v): v is (typeof categoryEnum.enumValues)[number] => v !== undefined),
  ),
]
const unmappedStreams = streams.filter((s) => !STREAM_CATEGORY_MAP[s.toLowerCase()])
```

- [ ] **Step 3: Force NIRF sort when a stream goal is active**

Find:
```ts
const defaultSort: SortOption = q ? 'relevance' : 'recent'
```

Replace with:
```ts
const defaultSort: SortOption = q ? 'relevance' : streams.length > 0 ? 'nirf_asc' : 'recent'
```

- [ ] **Step 4: Update `buildCourseExists` to use `unmappedStreams`**

Inside `buildCourseExists`, find:
```ts
  if (includeStream && streams.length) {
    const streamConds = streams.map((s) => {
```

Replace with:
```ts
  if (includeStream && unmappedStreams.length) {
    const streamConds = unmappedStreams.map((s) => {
```

- [ ] **Step 5: Inject mapped category conditions into `baseConditions`**

Find (around line 162):
```ts
  const courseFilter = buildCourseExists()
  if (courseFilter) baseConditions.push(courseFilter)
```

Insert **before** those two lines:
```ts
  if (mappedStreamCategories.length === 1) {
    baseConditions.push(eq(colleges.category, mappedStreamCategories[0]))
  } else if (mappedStreamCategories.length > 1) {
    baseConditions.push(inArray(colleges.category, mappedStreamCategories))
  }
```

- [ ] **Step 6: Add cutoff fields to the Drizzle `.select()`**

Find:
```ts
      type: colleges.type,
      minAnnualFee: minAnnualFeeExpression,
```

Replace with:
```ts
      type: colleges.type,
      engineeringCutoff: colleges.engineeringCutoff,
      medicalCutoff: colleges.medicalCutoff,
      minAnnualFee: minAnnualFeeExpression,
```

- [ ] **Step 7: Update hero quick-filter chips to use stream params**

Find the hero chips block that maps over `['engineering', 'medical', 'arts_science']`:
```tsx
          {(['engineering', 'medical', 'arts_science'] as const).map((cat) => (
            <Link
              key={cat}
              href={buildPageHref(1, { ...filters, category: category === cat ? undefined : cat })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors duration-200',
                category === cat
                  ? 'border-transparent bg-md-secondary-container text-md-on-secondary-container'
                  : 'border-md-outline/40 text-md-on-surface-variant hover:bg-md-primary/10',
              )}
            >
              {cat === 'arts_science' ? 'Arts & Science' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Link>
          ))}
```

Replace with:
```tsx
          {(['Engineering', 'Medical', 'Arts & Science'] as const).map((streamName) => (
            <Link
              key={streamName}
              href={buildPageHref(1, {
                ...filters,
                stream: streams.includes(streamName)
                  ? streams.filter((s) => s !== streamName)
                  : [streamName],
                category: undefined,
              })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm transition-colors duration-200',
                streams.includes(streamName)
                  ? 'border-transparent bg-md-secondary-container text-md-on-secondary-container'
                  : 'border-md-outline/40 text-md-on-surface-variant hover:bg-md-primary/10',
              )}
            >
              {streamName}
            </Link>
          ))}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: exits with code 0, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/colleges/page.tsx
git commit -m "feat: add stream-to-category mapping and fix explore filter logic"
```

---

### Task 4: Create Top10Table component

**Files:**
- Create: `src/app/colleges/_components/Top10Table.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link'

type Top10College = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  nirfRank: number | null
  engineeringCutoff: string | null
  medicalCutoff: string | null
  minAnnualFee: string | null
}

type Props = {
  colleges: Top10College[]
  streamName: string
  viewAllHref: string
}

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

function formatFee(fee: string | null): string {
  if (!fee) return '—'
  const num = Number(fee)
  if (Number.isNaN(num)) return '—'
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L/yr`
  return `₹${Math.round(num / 1000)}K/yr`
}

function formatCutoff(
  streamName: string,
  engineeringCutoff: string | null,
  medicalCutoff: string | null,
): string {
  const lower = streamName.toLowerCase()
  if (lower === 'engineering' && engineeringCutoff)
    return Number(engineeringCutoff).toFixed(2)
  if (lower === 'medical' && medicalCutoff)
    return Number(medicalCutoff).toFixed(2)
  return '—'
}

export function Top10Table({ colleges, streamName, viewAllHref }: Props) {
  return (
    <div className="animate-slide-up">
      {/* Badge + View All */}
      <div className="mb-5 flex items-center justify-between animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-full bg-md-secondary-container px-4 py-1.5">
          <span className="text-sm font-medium text-md-on-secondary-container">
            {streamName} — Top 10 Colleges
          </span>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm text-md-primary transition-colors duration-200 hover:underline"
        >
          View all {streamName} colleges →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl bg-md-surface-container shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-md-outline/20 bg-md-surface-container-high">
              <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                College
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                NIRF
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                Cutoff
              </th>
              <th className="w-36 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                Total Fees
              </th>
            </tr>
          </thead>
          <tbody>
            {colleges.map((college, index) => (
              <tr
                key={college.id}
                className="animate-fade-in border-b border-md-outline/10 transition-colors duration-150 hover:bg-md-surface-container-high last:border-0"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-md-primary/10 text-xs font-semibold text-md-primary">
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/colleges/${college.slug}`}
                    className="font-medium text-md-on-surface transition-colors duration-150 hover:text-md-primary"
                  >
                    {college.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-md-on-surface-variant">
                    {formatLocation(college.city, college.state)}
                  </p>
                </td>
                <td className="px-4 py-4 text-md-on-surface-variant">
                  {college.nirfRank ? `#${college.nirfRank}` : '—'}
                </td>
                <td className="px-4 py-4 text-md-on-surface-variant">
                  {formatCutoff(streamName, college.engineeringCutoff, college.medicalCutoff)}
                </td>
                <td className="px-4 py-4 text-md-on-surface-variant">
                  {formatFee(college.minAnnualFee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: exits with code 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/colleges/_components/Top10Table.tsx
git commit -m "feat: add Top10Table component with staggered animations"
```

---

### Task 5: Wire Top10Table into page.tsx

**Files:**
- Modify: `src/app/colleges/page.tsx`

- [ ] **Step 1: Import Top10Table**

After the existing component imports (after the `FilterSelect` import line), add:

```ts
import { Top10Table } from './_components/Top10Table'
```

- [ ] **Step 2: Derive top10 variables after the existing `hasMore` / `visibleResults` lines**

Find:
```ts
  const hasMore = rows.length > limit
  const visibleResults = hasMore ? rows.slice(0, limit) : rows
```

Insert after those two lines:
```ts
  const isTop10Mode = streams.length > 0
  const top10Rows = isTop10Mode ? rows.slice(0, 10) : []
  const activeStreamLabel = streams[0] ?? ''
```

- [ ] **Step 3: Replace the results + pagination block**

Find the entire block starting with `{/* Results */}` and ending with the closing `</div>` of the pagination section (the last `</div>` before the outer `</div>` that closes `min-w-0 flex-1`). The block to replace starts with:

```tsx
          {/* Results */}
          <h2 className="sr-only">College Results</h2>
          {visibleResults.length === 0 ? (
```

and ends with:
```tsx
          )}
        </div>
      </div>
    </div>
  )
}
```

Replace the entire results + pagination section (keep the outer closing divs) with:

```tsx
          {/* Results */}
          <h2 className="sr-only">College Results</h2>
          {isTop10Mode ? (
            top10Rows.length === 0 ? (
              <div className="animate-fade-in rounded-3xl bg-md-surface-container p-14 text-center shadow-sm">
                <h3 className="text-xl font-medium text-md-on-surface">No colleges found</h3>
                <p className="mt-2 text-md-on-surface-variant">
                  Try adjusting your filters or search query.
                </p>
                <Link
                  href="/colleges"
                  className="mt-6 inline-flex h-10 items-center rounded-full bg-md-primary px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-md-primary/90 active:scale-95"
                >
                  Clear all filters
                </Link>
              </div>
            ) : (
              <Top10Table
                key={activeStreamLabel}
                colleges={top10Rows}
                streamName={activeStreamLabel}
                viewAllHref={buildPageHref(1, { ...filters, stream: [] })}
              />
            )
          ) : visibleResults.length === 0 ? (
            <div className="rounded-3xl bg-md-surface-container p-14 text-center shadow-sm">
              <h3 className="text-xl font-medium text-md-on-surface">No colleges found</h3>
              <p className="mt-2 text-md-on-surface-variant">
                Try adjusting your filters or search query.
              </p>
              <Link
                href="/colleges"
                className="mt-6 inline-flex h-10 items-center rounded-full bg-md-primary px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-md-primary/90 active:scale-95"
              >
                Clear all filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {visibleResults.map((college) => (
                <CollegeCard
                  key={college.id}
                  college={college}
                  discoveryScore={calculateDiscoveryScore(college.nirfRank)}
                  isShortlisted={userShortlists.has(college.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination — card grid mode only */}
          {!isTop10Mode && visibleResults.length > 0 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Link
                href={buildPageHref(Math.max(1, page - 1), filters)}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border border-md-outline/40 px-5 text-sm text-md-on-surface-variant transition-all duration-200 hover:bg-md-primary/10 active:scale-95',
                  page <= 1 && 'pointer-events-none opacity-40',
                )}
              >
                Previous
              </Link>
              <span className="inline-flex h-9 items-center rounded-full bg-md-primary px-4 text-sm text-white">
                {page}
              </span>
              <Link
                href={buildPageHref(page + 1, filters)}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border border-md-outline/40 px-5 text-sm text-md-on-surface-variant transition-all duration-200 hover:bg-md-primary/10 active:scale-95',
                  !hasMore && 'pointer-events-none opacity-40',
                )}
              >
                Next
              </Link>
            </div>
          )}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: exits with code 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/colleges/page.tsx
git commit -m "feat: render Top10Table when stream goal is active"
```

---

### Task 6: Expand seed data

**Files:**
- Modify: `src/scripts/seed-demo-colleges.ts`

- [ ] **Step 1: Update the type definition and replace the `demoColleges` array**

Replace the type inside the `Array<{...}>` annotation to add the two new optional fields, then replace the entire array contents. The complete new type + array:

```ts
const demoColleges: Array<{
  name: string
  city: string
  state: string
  nirfRank?: number
  category: 'engineering' | 'medical' | 'arts_science'
  collegeType: 'affiliated' | 'university' | 'autonomous'
  engineeringCutoff?: number
  medicalCutoff?: number
  courses: Array<{
    name: string
    degree: string
    duration: number
    courseLevel: 'ug' | 'pg' | 'doctorate' | 'diploma' | 'certification'
    stream: string
    annualFee: number
  }>
}> = [
  // ── ENGINEERING (15) ──────────────────────────────────────────────────────
  {
    name: 'IIT Madras',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 1,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.80,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 112000 },
      { name: 'B.Tech Mechanical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 112000 },
      { name: 'M.Tech VLSI Design', degree: 'M.Tech', duration: 2, courseLevel: 'pg', stream: 'Electronics Engineering', annualFee: 45000 },
    ],
  },
  {
    name: 'IIT Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 2,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.60,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 110000 },
      { name: 'B.Tech Electrical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Electrical Engineering', annualFee: 110000 },
    ],
  },
  {
    name: 'IIT Bombay',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 3,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.50,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 220000 },
      { name: 'B.Tech Chemical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Chemical Engineering', annualFee: 220000 },
    ],
  },
  {
    name: 'IIT Kanpur',
    city: 'Kanpur', state: 'Uttar Pradesh', nirfRank: 4,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.40,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 108000 },
      { name: 'B.Tech Aerospace Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Aerospace Engineering', annualFee: 108000 },
    ],
  },
  {
    name: 'IIT Kharagpur',
    city: 'Kharagpur', state: 'West Bengal', nirfRank: 5,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 99.20,
    courses: [
      { name: 'B.Tech Civil Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Civil Engineering', annualFee: 105000 },
      { name: 'B.Tech Mining Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mining Engineering', annualFee: 105000 },
    ],
  },
  {
    name: 'NIT Trichy',
    city: 'Tiruchirappalli', state: 'Tamil Nadu', nirfRank: 10,
    category: 'engineering', collegeType: 'autonomous', engineeringCutoff: 97.20,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 145000 },
      { name: 'B.Tech Mechanical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 145000 },
    ],
  },
  {
    name: 'NIT Warangal',
    city: 'Warangal', state: 'Telangana', nirfRank: 15,
    category: 'engineering', collegeType: 'autonomous', engineeringCutoff: 96.50,
    courses: [
      { name: 'B.Tech Electronics & Communication', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Electronics Engineering', annualFee: 140000 },
      { name: 'B.Tech Chemical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Chemical Engineering', annualFee: 140000 },
    ],
  },
  {
    name: 'BITS Pilani',
    city: 'Pilani', state: 'Rajasthan', nirfRank: 25,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 96.00,
    courses: [
      { name: 'B.E. Computer Science', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 490000 },
      { name: 'B.E. Electrical & Electronics', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Electrical Engineering', annualFee: 490000 },
    ],
  },
  {
    name: 'VIT Vellore',
    city: 'Vellore', state: 'Tamil Nadu', nirfRank: 20,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 95.00,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 198000 },
      { name: 'B.Tech Information Technology', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Information Technology', annualFee: 198000 },
    ],
  },
  {
    name: 'Jadavpur University',
    city: 'Kolkata', state: 'West Bengal', nirfRank: 18,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 96.00,
    courses: [
      { name: 'B.E. Computer Science', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 22000 },
      { name: 'B.E. Electronics & Telecom', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Electronics Engineering', annualFee: 22000 },
    ],
  },
  {
    name: 'Delhi Technological University',
    city: 'Delhi', state: 'Delhi', nirfRank: 35,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 94.50,
    courses: [
      { name: 'B.Tech Computer Science', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 175000 },
      { name: 'B.Tech Software Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Software Engineering', annualFee: 175000 },
    ],
  },
  {
    name: 'COEP Technological University Pune',
    city: 'Pune', state: 'Maharashtra', nirfRank: 48,
    category: 'engineering', collegeType: 'autonomous', engineeringCutoff: 91.50,
    courses: [
      { name: 'B.Tech Mechanical Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 112000 },
      { name: 'B.Tech Civil Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Civil Engineering', annualFee: 112000 },
    ],
  },
  {
    name: 'Thapar Institute of Engineering and Technology',
    city: 'Patiala', state: 'Punjab', nirfRank: 55,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 90.00,
    courses: [
      { name: 'B.E. Computer Engineering', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 315000 },
      { name: 'B.E. Electronics & Communication', degree: 'B.E.', duration: 4, courseLevel: 'ug', stream: 'Electronics Engineering', annualFee: 315000 },
    ],
  },
  {
    name: 'SRM Institute of Science and Technology',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 50,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 89.00,
    courses: [
      { name: 'B.Tech Computer Science & Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 250000 },
      { name: 'B.Tech Biotechnology', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Biotechnology', annualFee: 250000 },
    ],
  },
  {
    name: 'Manipal Institute of Technology',
    city: 'Manipal', state: 'Karnataka', nirfRank: 80,
    category: 'engineering', collegeType: 'university', engineeringCutoff: 85.00,
    courses: [
      { name: 'B.Tech Computer & Communication Engineering', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Computer Science', annualFee: 275000 },
      { name: 'B.Tech Mechatronics', degree: 'B.Tech', duration: 4, courseLevel: 'ug', stream: 'Mechanical Engineering', annualFee: 275000 },
    ],
  },

  // ── MEDICAL (15) ──────────────────────────────────────────────────────────
  {
    name: 'AIIMS New Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 1,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.90,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1628 },
      { name: 'MD Internal Medicine', degree: 'MD', duration: 3, courseLevel: 'pg', stream: 'Medicine', annualFee: 5000 },
    ],
  },
  {
    name: 'PGIMER Chandigarh',
    city: 'Chandigarh', state: 'Punjab', nirfRank: 2,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.80,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 2000 },
      { name: 'MS General Surgery', degree: 'MS', duration: 3, courseLevel: 'pg', stream: 'Surgery', annualFee: 5000 },
    ],
  },
  {
    name: 'CMC Vellore',
    city: 'Vellore', state: 'Tamil Nadu', nirfRank: 3,
    category: 'medical', collegeType: 'autonomous', medicalCutoff: 99.75,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 75000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 95000 },
    ],
  },
  {
    name: 'AIIMS Bhopal',
    city: 'Bhopal', state: 'Madhya Pradesh', nirfRank: 4,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.70,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1628 },
      { name: 'B.Sc Nursing', degree: 'B.Sc', duration: 4, courseLevel: 'ug', stream: 'Nursing', annualFee: 15000 },
    ],
  },
  {
    name: 'JIPMER Puducherry',
    city: 'Puducherry', state: 'Puducherry', nirfRank: 5,
    category: 'medical', collegeType: 'university', medicalCutoff: 99.60,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1000 },
    ],
  },
  {
    name: 'Maulana Azad Medical College',
    city: 'Delhi', state: 'Delhi', nirfRank: 7,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.40,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 28000 },
      { name: 'MD Pathology', degree: 'MD', duration: 3, courseLevel: 'pg', stream: 'Medicine', annualFee: 50000 },
    ],
  },
  {
    name: 'Madras Medical College',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 9,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.10,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 28000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 35000 },
    ],
  },
  {
    name: 'Seth GS Medical College Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 11,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.05,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 40000 },
      { name: 'MD Biochemistry', degree: 'MD', duration: 3, courseLevel: 'pg', stream: 'Medicine', annualFee: 60000 },
    ],
  },
  {
    name: 'Grant Medical College Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 12,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 99.00,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 35000 },
    ],
  },
  {
    name: 'Bangalore Medical College and Research Institute',
    city: 'Bangalore', state: 'Karnataka', nirfRank: 15,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 98.80,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 30000 },
      { name: 'B.Sc Nursing', degree: 'B.Sc', duration: 4, courseLevel: 'ug', stream: 'Nursing', annualFee: 55000 },
    ],
  },
  {
    name: 'Kasturba Medical College Manipal',
    city: 'Manipal', state: 'Karnataka', nirfRank: 18,
    category: 'medical', collegeType: 'university', medicalCutoff: 98.50,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1350000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 850000 },
    ],
  },
  {
    name: 'MS Ramaiah Medical College Bangalore',
    city: 'Bangalore', state: 'Karnataka', nirfRank: 22,
    category: 'medical', collegeType: 'autonomous', medicalCutoff: 98.20,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 950000 },
    ],
  },
  {
    name: 'Jawaharlal Nehru Medical College Belgaum',
    city: 'Belagavi', state: 'Karnataka', nirfRank: 28,
    category: 'medical', collegeType: 'affiliated', medicalCutoff: 97.80,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 550000 },
      { name: 'BPT', degree: 'BPT', duration: 4, courseLevel: 'ug', stream: 'Physiotherapy', annualFee: 120000 },
    ],
  },
  {
    name: 'Sri Ramachandra Medical College Chennai',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 30,
    category: 'medical', collegeType: 'university', medicalCutoff: 97.50,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 1100000 },
      { name: 'BAMS', degree: 'BAMS', duration: 5, courseLevel: 'ug', stream: 'Ayurveda', annualFee: 250000 },
    ],
  },
  {
    name: 'PSG Institute of Medical Sciences Coimbatore',
    city: 'Coimbatore', state: 'Tamil Nadu', nirfRank: 35,
    category: 'medical', collegeType: 'autonomous', medicalCutoff: 97.20,
    courses: [
      { name: 'MBBS', degree: 'MBBS', duration: 5, courseLevel: 'ug', stream: 'Medicine', annualFee: 750000 },
      { name: 'BDS', degree: 'BDS', duration: 5, courseLevel: 'ug', stream: 'Dentistry', annualFee: 550000 },
    ],
  },

  // ── ARTS & SCIENCE (10) ───────────────────────────────────────────────────
  {
    name: 'Miranda House Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 1,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA Honours English', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 15000 },
      { name: 'B.Sc Physics Honours', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Physics', annualFee: 15000 },
    ],
  },
  {
    name: 'Lady Shri Ram College Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 2,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA Honours Economics', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Economics', annualFee: 18000 },
      { name: 'BA Honours Psychology', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Psychology', annualFee: 18000 },
    ],
  },
  {
    name: 'Hindu College Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 3,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA Honours History', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'History', annualFee: 12000 },
      { name: 'B.Sc Chemistry Honours', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Chemistry', annualFee: 12000 },
    ],
  },
  {
    name: 'Loyola College Chennai',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 5,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Economics', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Economics', annualFee: 22000 },
      { name: 'B.Sc Mathematics', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Mathematics', annualFee: 22000 },
    ],
  },
  {
    name: "St Xavier's College Mumbai",
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 8,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Sociology', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Sociology', annualFee: 28000 },
      { name: 'B.Sc Life Sciences', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Life Sciences', annualFee: 28000 },
    ],
  },
  {
    name: 'Madras Christian College',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 10,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA English', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 20000 },
      { name: 'B.Sc Zoology', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Zoology', annualFee: 20000 },
    ],
  },
  {
    name: 'Presidency College Chennai',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 12,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'BA History', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'History', annualFee: 8000 },
      { name: 'B.Sc Statistics', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Statistics', annualFee: 8000 },
    ],
  },
  {
    name: 'Christ University Bangalore',
    city: 'Bangalore', state: 'Karnataka', nirfRank: 15,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA English Honours', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'English', annualFee: 85000 },
      { name: 'B.Sc Data Science', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Data Science', annualFee: 95000 },
    ],
  },
  {
    name: 'Fergusson College Pune',
    city: 'Pune', state: 'Maharashtra', nirfRank: 18,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Political Science', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Political Science', annualFee: 15000 },
      { name: 'B.Sc Biotechnology', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Biotechnology', annualFee: 18000 },
    ],
  },
  {
    name: 'Stella Maris College Chennai',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 22,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'BA Social Work', degree: 'BA', duration: 3, courseLevel: 'ug', stream: 'Social Work', annualFee: 25000 },
      { name: 'B.Sc Computer Science', degree: 'B.Sc', duration: 3, courseLevel: 'ug', stream: 'Computer Science', annualFee: 25000 },
    ],
  },

  // ── MANAGEMENT (10) ───────────────────────────────────────────────────────
  {
    name: 'IIM Ahmedabad',
    city: 'Ahmedabad', state: 'Gujarat', nirfRank: 1,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'Post Graduate Programme in Management', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1100000 },
      { name: 'Fellow Programme in Management', degree: 'FPM', duration: 4, courseLevel: 'doctorate', stream: 'Management', annualFee: 100000 },
    ],
  },
  {
    name: 'IIM Bangalore',
    city: 'Bangalore', state: 'Karnataka', nirfRank: 2,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'Post Graduate Programme in Management', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1100000 },
    ],
  },
  {
    name: 'IIM Calcutta',
    city: 'Kolkata', state: 'West Bengal', nirfRank: 3,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1050000 },
    ],
  },
  {
    name: 'IIM Lucknow',
    city: 'Lucknow', state: 'Uttar Pradesh', nirfRank: 5,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'Post Graduate Programme in Management', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1050000 },
    ],
  },
  {
    name: 'XLRI Jamshedpur',
    city: 'Jamshedpur', state: 'Jharkhand', nirfRank: 8,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'MBA Business Management', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1140000 },
      { name: 'MBA Human Resource Management', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1140000 },
    ],
  },
  {
    name: 'SPJIMR Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 10,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'PGDM', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1050000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Management', annualFee: 150000 },
    ],
  },
  {
    name: 'MDI Gurgaon',
    city: 'Gurgaon', state: 'Haryana', nirfRank: 12,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'PGDM', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 2300000 },
    ],
  },
  {
    name: 'NMIMS Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 15,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1400000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Management', annualFee: 280000 },
    ],
  },
  {
    name: 'Symbiosis Institute of Business Management Pune',
    city: 'Pune', state: 'Maharashtra', nirfRank: 25,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'MBA', degree: 'MBA', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1300000 },
    ],
  },
  {
    name: 'IMT Ghaziabad',
    city: 'Ghaziabad', state: 'Uttar Pradesh', nirfRank: 20,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'PGDM', degree: 'PGDM', duration: 2, courseLevel: 'pg', stream: 'Management', annualFee: 1600000 },
      { name: 'Executive PGDM', degree: 'PGDM', duration: 1, courseLevel: 'pg', stream: 'Management', annualFee: 1200000 },
    ],
  },

  // ── COMMERCE (8) ─────────────────────────────────────────────────────────
  {
    name: 'SRCC Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 1,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'B.Com (Honours)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 16000 },
      { name: 'M.Com', degree: 'M.Com', duration: 2, courseLevel: 'pg', stream: 'Commerce', annualFee: 20000 },
    ],
  },
  {
    name: 'Hindu Commerce College Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 3,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'B.Com (Honours)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 14000 },
    ],
  },
  {
    name: 'Christ University Commerce Bangalore',
    city: 'Bangalore', state: 'Karnataka', nirfRank: 5,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'B.Com (Professional)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 65000 },
      { name: 'M.Com', degree: 'M.Com', duration: 2, courseLevel: 'pg', stream: 'Commerce', annualFee: 75000 },
    ],
  },
  {
    name: 'Narsee Monjee College Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 8,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com (Accounting & Finance)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 32000 },
      { name: 'B.Com (Financial Markets)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 32000 },
    ],
  },
  {
    name: 'Loyola College Commerce Chennai',
    city: 'Chennai', state: 'Tamil Nadu', nirfRank: 10,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com General', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 22000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 28000 },
    ],
  },
  {
    name: 'Jai Hind College Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 12,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'B.Com (Commerce)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 25000 },
      { name: 'BMS', degree: 'BMS', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 30000 },
    ],
  },
  {
    name: 'HR College of Commerce Mumbai',
    city: 'Mumbai', state: 'Maharashtra', nirfRank: 15,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com (Accounting)', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 28000 },
    ],
  },
  {
    name: 'Bishop Heber College Tiruchirappalli',
    city: 'Tiruchirappalli', state: 'Tamil Nadu', nirfRank: 20,
    category: 'arts_science', collegeType: 'autonomous',
    courses: [
      { name: 'B.Com General', degree: 'B.Com', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 18000 },
      { name: 'BBA', degree: 'BBA', duration: 3, courseLevel: 'ug', stream: 'Commerce', annualFee: 22000 },
    ],
  },

  // ── LAW (8) ───────────────────────────────────────────────────────────────
  {
    name: 'National Law School of India University',
    city: 'Bangalore', state: 'Karnataka', nirfRank: 1,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 217000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 80000 },
    ],
  },
  {
    name: 'NALSAR University of Law',
    city: 'Hyderabad', state: 'Telangana', nirfRank: 2,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 195000 },
    ],
  },
  {
    name: 'National Law University Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 3,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 204000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 75000 },
    ],
  },
  {
    name: 'Campus Law Centre Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 4,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'LLB (3 Year)', degree: 'LLB', duration: 3, courseLevel: 'ug', stream: 'Law', annualFee: 12000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 15000 },
    ],
  },
  {
    name: 'National Law University Jodhpur',
    city: 'Jodhpur', state: 'Rajasthan', nirfRank: 5,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 230000 },
    ],
  },
  {
    name: 'Symbiosis Law School Pune',
    city: 'Pune', state: 'Maharashtra', nirfRank: 8,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 280000 },
      { name: 'BBA LLB', degree: 'BBA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 280000 },
    ],
  },
  {
    name: 'Amity Law School Delhi',
    city: 'Delhi', state: 'Delhi', nirfRank: 10,
    category: 'arts_science', collegeType: 'university',
    courses: [
      { name: 'BA LLB (Hons.)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 195000 },
      { name: 'LLM', degree: 'LLM', duration: 1, courseLevel: 'pg', stream: 'Law', annualFee: 180000 },
    ],
  },
  {
    name: 'ILS Law College Pune',
    city: 'Pune', state: 'Maharashtra', nirfRank: 12,
    category: 'arts_science', collegeType: 'affiliated',
    courses: [
      { name: 'LLB (3 Year)', degree: 'LLB', duration: 3, courseLevel: 'ug', stream: 'Law', annualFee: 22000 },
      { name: 'BA LLB (5 Year)', degree: 'BA LLB', duration: 5, courseLevel: 'ug', stream: 'Law', annualFee: 22000 },
    ],
  },
]
```

- [ ] **Step 2: Update the `db.insert` call to include cutoff fields**

Find in the `main` function:
```ts
      const [inserted] = await db
        .insert(schema.colleges)
        .values({
          userId,
          name: col.name,
          slug: collegeSlug,
          city: col.city,
          state: col.state,
          nirfRank: col.nirfRank,
          category: col.category,
          collegeType: col.collegeType,
          verificationStatus: 'approved',
        })
```

Replace with:
```ts
      const [inserted] = await db
        .insert(schema.colleges)
        .values({
          userId,
          name: col.name,
          slug: collegeSlug,
          city: col.city,
          state: col.state,
          nirfRank: col.nirfRank,
          category: col.category,
          collegeType: col.collegeType,
          verificationStatus: 'approved',
          engineeringCutoff: col.engineeringCutoff !== undefined ? String(col.engineeringCutoff) : undefined,
          medicalCutoff: col.medicalCutoff !== undefined ? String(col.medicalCutoff) : undefined,
        })
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: exits with code 0.

- [ ] **Step 4: Run the seed**

```bash
npx tsx src/scripts/seed-demo-colleges.ts
```

Expected: lines like `inserted: IIT Madras`, `inserted: AIIMS New Delhi`, etc. Existing entries from prior runs show `skip (exists):`. Final line shows count of inserted colleges and courses.

- [ ] **Step 5: Commit**

```bash
git add src/scripts/seed-demo-colleges.ts
git commit -m "feat: expand seed data to 66 colleges across 6 streams"
```

---

### Task 7: End-to-end verification

**Files:** None (verification only)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test all six goal flows**

Visit each URL and verify the Top 10 table appears with staggered row fade-in, ordered by NIRF rank:

| Goal | URL to test | Expected rank 1 |
|---|---|---|
| Engineering | `http://localhost:3000/colleges?stream=Engineering` | IIT Madras |
| Medical | `http://localhost:3000/colleges?stream=Medical` | AIIMS New Delhi |
| Arts & Science | `http://localhost:3000/colleges?stream=Arts+%26+Science` | Miranda House Delhi |
| Management | `http://localhost:3000/colleges?stream=Management` | IIM Ahmedabad |
| Commerce | `http://localhost:3000/colleges?stream=Commerce` | SRCC Delhi |
| Law | `http://localhost:3000/colleges?stream=Law` | National Law School of India University |

- [ ] **Step 3: Test combined filter**

Visit `http://localhost:3000/colleges?stream=Engineering&state=Tamil+Nadu`

Expected: only Tamil Nadu engineering colleges (IIT Madras, NIT Trichy, VIT, SRM, Manipal — those seeded in Tamil Nadu) appear in the table.

- [ ] **Step 4: Test card grid still works**

Visit `http://localhost:3000/colleges` (no stream param)

Expected: card grid shown as before, pagination visible.

- [ ] **Step 5: Test hero chip toggle**

On the Explore page:
1. Click "Engineering" hero chip → top 10 table appears, chip is highlighted
2. Click "Engineering" chip again → stream deselects, card grid returns

- [ ] **Step 6: Test home page goal cards**

Visit `http://localhost:3000`, hover over each goal card and confirm the href shows the correct `?stream=` param in the status bar. Click one — should land on the Top 10 table.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: verify explore filter + top10 table implementation complete"
```

---

## Spec Coverage Checklist

| Spec requirement | Task |
|---|---|
| Fix stream filtering — 0 results bug | Task 3 (STREAM_CATEGORY_MAP + `mappedStreamCategories` in baseConditions) |
| Case-insensitive matching | Task 3 (`.toLowerCase()` lookup in STREAM_CATEGORY_MAP; existing ILIKE unchanged for unmapped) |
| Proper mapping: UI labels → backend data | Task 3 (STREAM_CATEGORY_MAP) |
| Multiple filters applied AND together | Task 3 (all conditions pushed to `baseConditions`, existing AND logic preserved) |
| Seed 10–15 colleges per stream | Task 6 (15 engineering, 15 medical, 10 arts, 10 mgmt, 8 commerce, 8 law = 66 total) |
| Goal-based routing → `?stream=<name>` | Task 2 (StudyGoalSection hrefs) |
| Pre-apply stream filter on arrival | Task 3 (filter reads `stream` param from URL on every render) |
| Top 10 table replaces card grid when stream active | Tasks 4 + 5 |
| Table columns: Rank, College+Location, NIRF, Cutoff, Total Fees | Task 4 (Top10Table component) |
| Animations + slide-ins | Tasks 1 + 4 (`animate-slide-up` on container, `animate-fade-in` with stagger on rows) |
| Hero chips use stream params | Task 3 Step 7 |
