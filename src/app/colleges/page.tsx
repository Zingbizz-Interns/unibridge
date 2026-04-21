import { Suspense } from 'react'
import { and, desc, eq, exists, gte, inArray, lte, or, SQL, sql } from 'drizzle-orm'
import Link from 'next/link'
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { colleges, shortlists, courses, categoryEnum, collegeTypeEnum, courseLevelEnum } from '@/db/schema'
import { DiscoveryAnalyticsTracker } from '@/components/DiscoveryAnalyticsTracker'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { cn } from '@/lib/utils'
import { INDIAN_STATES } from '@/validators/college-profile'
import { CollegeCard } from './_components/CollegeCard'
import { FilterSelect } from './_components/FilterSelect'

export const dynamic = 'force-dynamic'

const SORT_OPTIONS = ['relevance', 'recent', 'nirf_asc', 'fee_low', 'fee_high'] as const
const CATEGORY_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Medical', value: 'medical' },
  { label: 'Arts & Science', value: 'arts_science' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]
type CategoryFilter = (typeof CATEGORY_TABS)[number]['value']
type SearchParams = Record<string, string | string[] | undefined>

type Facet = { value: string; count: number }

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

function titleize(value: string) {
  return value.split(/[_\s-]+/).filter(Boolean).map((v) => v[0].toUpperCase() + v.slice(1)).join(' ')
}

function normalizeCategory(rawValue: string | undefined): CategoryFilter {
  if (!rawValue) return 'all'
  const normalized = rawValue.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (normalized === 'engineering' || normalized === 'medical' || normalized === 'arts_science') return normalized
  if (normalized === 'arts_and_science' || normalized === 'artsandscience') return 'arts_science'
  return 'all'
}

function normalizeCollegeType(rawValue: string | undefined) {
  if (!rawValue) return undefined
  const normalized = rawValue.trim().toLowerCase()
  return (collegeTypeEnum.enumValues as readonly string[]).includes(normalized) ? normalized : undefined
}

function readStringParam(params: SearchParams, key: string) {
  const rawValue = params[key]
  const value = Array.isArray(rawValue) ? rawValue[rawValue.length - 1] : rawValue
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function readArrayParam(params: SearchParams, key: string) {
  const value = params[key]
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function buildPageHref(page: number, filters: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
      continue
    }
    params.set(key, value)
  }
  return `/colleges?${params.toString()}`
}

function asFacets<T extends { value: string | null; count: unknown }>(rows: T[]): Facet[] {
  return rows
    .map((row) => ({ value: row.value?.trim() ?? '', count: Number(row.count) || 0 }))
    .filter((row) => row.value)
}

function calculateDiscoveryScore(nirfRank: number | null) {
  if (!nirfRank || nirfRank <= 0) {
    return 42
  }
  const scaled = Math.round(100 - Math.min(78, nirfRank / 6))
  return Math.max(24, scaled)
}

export default async function CollegesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const page = Math.max(1, Number.parseInt(readStringParam(params, 'page') ?? '1', 10) || 1)
  const limit = 12
  const offset = (page - 1) * limit

  const q = readStringParam(params, 'q')
  const category = normalizeCategory(readStringParam(params, 'category'))
  const state = readStringParam(params, 'state')
  const city = readStringParam(params, 'city')
  const streams = readArrayParam(params, 'stream')
  const collegeTypes = readArrayParam(params, 'collegeType').filter(
    (v) => (collegeTypeEnum.enumValues as readonly string[]).includes(v),
  ) as (typeof collegeTypeEnum.enumValues)[number][]
  const feeMin = readStringParam(params, 'feeMin')
  const feeMax = readStringParam(params, 'feeMax')
  const minNirf = readStringParam(params, 'minNirf')
  const maxNirf = readStringParam(params, 'maxNirf')

  const defaultSort: SortOption = q ? 'relevance' : 'recent'
  const rawSort = readStringParam(params, 'sort')
  const sort: SortOption = rawSort && (SORT_OPTIONS as readonly string[]).includes(rawSort) ? (rawSort as SortOption) : defaultSort
  const isNonDefaultSort = sort !== defaultSort

  const requestedLevels = readArrayParam(params, 'courseLevel')
  const courseLevels = requestedLevels.filter((value) => (courseLevelEnum.enumValues as readonly string[]).includes(value)) as (typeof courseLevelEnum.enumValues)[number][]

  const minNirfNumber = parseNumber(minNirf)
  const maxNirfNumber = parseNumber(maxNirf)
  const feeMinNumber = parseNumber(feeMin)
  const feeMaxNumber = parseNumber(feeMax)

  const [effectiveFeeMin, effectiveFeeMax] = feeMinNumber !== undefined && feeMaxNumber !== undefined && feeMinNumber > feeMaxNumber
    ? [feeMaxNumber, feeMinNumber]
    : [feeMinNumber, feeMaxNumber]

  const buildCourseExists = ({ includeStream = true }: { includeStream?: boolean } = {}) => {
    const courseConditions: SQL[] = [eq(courses.collegeId, colleges.id)]
    if (courseLevels.length) courseConditions.push(inArray(courses.courseLevel, courseLevels))
    if (includeStream && streams.length) {
      const streamConds = streams.map((s) => {
        const q = `%${s}%`
        return sql<boolean>`(${courses.stream} ILIKE ${q} OR ${courses.name} ILIKE ${q} OR ${courses.degree} ILIKE ${q})`
      })
      courseConditions.push(streamConds.length === 1 ? streamConds[0] : or(...streamConds)!)
    }
    if (effectiveFeeMin !== undefined) courseConditions.push(gte(courses.annualFee, String(effectiveFeeMin)))
    if (effectiveFeeMax !== undefined) courseConditions.push(lte(courses.annualFee, String(effectiveFeeMax)))
    return courseConditions.length > 1 ? exists(db.select({ id: courses.id }).from(courses).where(and(...courseConditions))) : undefined
  }

  const baseConditions: SQL[] = [eq(colleges.verificationStatus, 'approved')]
  if (q) baseConditions.push(sql`${colleges.name} % ${q}`)
  if (category !== 'all') baseConditions.push(eq(colleges.category, category as (typeof categoryEnum.enumValues)[number]))
  if (state) baseConditions.push(eq(colleges.state, state))
  if (city) baseConditions.push(eq(colleges.city, city))
  if (collegeTypes.length) baseConditions.push(inArray(colleges.collegeType, collegeTypes))
  if (minNirfNumber !== undefined) baseConditions.push(gte(colleges.nirfRank, minNirfNumber))
  if (maxNirfNumber !== undefined) baseConditions.push(lte(colleges.nirfRank, maxNirfNumber))
  const courseFilter = buildCourseExists()
  if (courseFilter) baseConditions.push(courseFilter)

  const queryConditions = and(...baseConditions)

  const minAnnualFeeExpression = sql<string | null>`(
    SELECT MIN(${courses.annualFee}) FROM ${courses} WHERE ${courses.collegeId} = ${colleges.id}
  )`

  const query = db
    .select({
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      city: colleges.city,
      state: colleges.state,
      logoUrl: colleges.logoUrl,
      nirfRank: colleges.nirfRank,
      category: colleges.category,
      collegeType: colleges.collegeType,
      type: colleges.type,
      minAnnualFee: minAnnualFeeExpression,
    })
    .from(colleges)
    .where(queryConditions)
    .limit(limit + 1)
    .offset(offset)
    .$dynamic()

  if (sort === 'nirf_asc') query.orderBy(sql`${colleges.nirfRank} ASC NULLS LAST`, desc(colleges.createdAt))
  else if (sort === 'fee_low') query.orderBy(sql`${minAnnualFeeExpression} ASC NULLS LAST`, desc(colleges.createdAt))
  else if (sort === 'fee_high') query.orderBy(sql`${minAnnualFeeExpression} DESC NULLS LAST`, desc(colleges.createdAt))
  else if (sort === 'relevance' && q) query.orderBy(desc(sql`similarity(${colleges.name}, ${q})`), desc(colleges.createdAt))
  else query.orderBy(desc(colleges.createdAt))

  const joinedFacetConditions: SQL[] = [eq(colleges.verificationStatus, 'approved')]
  if (category !== 'all') joinedFacetConditions.push(eq(colleges.category, category as (typeof categoryEnum.enumValues)[number]))
  if (state) joinedFacetConditions.push(eq(colleges.state, state))
  if (city) joinedFacetConditions.push(eq(colleges.city, city))
  if (collegeTypes.length) joinedFacetConditions.push(inArray(colleges.collegeType, collegeTypes))
  if (courseLevels.length) joinedFacetConditions.push(inArray(courses.courseLevel, courseLevels))
  if (effectiveFeeMin !== undefined) joinedFacetConditions.push(gte(courses.annualFee, String(effectiveFeeMin)))
  if (effectiveFeeMax !== undefined) joinedFacetConditions.push(lte(courses.annualFee, String(effectiveFeeMax)))

  const cityFacetConditions: SQL[] = [eq(colleges.verificationStatus, 'approved')]
  if (q) cityFacetConditions.push(sql`${colleges.name} % ${q}`)
  if (category !== 'all') cityFacetConditions.push(eq(colleges.category, category as (typeof categoryEnum.enumValues)[number]))
  if (state) cityFacetConditions.push(eq(colleges.state, state))
  if (collegeTypes.length) cityFacetConditions.push(inArray(colleges.collegeType, collegeTypes))
  if (minNirfNumber !== undefined) cityFacetConditions.push(gte(colleges.nirfRank, minNirfNumber))
  if (maxNirfNumber !== undefined) cityFacetConditions.push(lte(colleges.nirfRank, maxNirfNumber))
  const cityCourseFilter = buildCourseExists()
  if (cityCourseFilter) cityFacetConditions.push(cityCourseFilter)

  const [rows, totalRows, degreeRows, streamRows, cityRows, stateRows, allCityRows] = await Promise.all([
    query,
    db.select({ total: sql<number>`count(*)` }).from(colleges).where(queryConditions),
    db.select({ value: courses.degree, count: sql<number>`count(*)` }).from(courses).innerJoin(colleges, eq(courses.collegeId, colleges.id)).where(and(...joinedFacetConditions, sql`${courses.degree} IS NOT NULL`, sql`${courses.degree} <> ''`)).groupBy(courses.degree).orderBy(desc(sql`count(*)`), courses.degree).limit(10),
    db.select({ value: courses.stream, count: sql<number>`count(*)` }).from(courses).innerJoin(colleges, eq(courses.collegeId, colleges.id)).where(and(...joinedFacetConditions, sql`${courses.stream} IS NOT NULL`, sql`${courses.stream} <> ''`)).groupBy(courses.stream).orderBy(desc(sql`count(*)`), courses.stream).limit(50),
    db.select({ value: colleges.city, count: sql<number>`count(*)` }).from(colleges).where(and(...cityFacetConditions, sql`${colleges.city} IS NOT NULL`, sql`${colleges.city} <> ''`)).groupBy(colleges.city).orderBy(desc(sql`count(*)`), colleges.city).limit(10),
    db.select({ value: colleges.state, count: sql<number>`count(*)` }).from(colleges).where(and(eq(colleges.verificationStatus, 'approved'), sql`${colleges.state} IS NOT NULL`, sql`${colleges.state} <> ''`)).groupBy(colleges.state).orderBy(desc(sql`count(*)`), colleges.state).limit(10),
    db.select({ value: colleges.city }).from(colleges).where(and(eq(colleges.verificationStatus, 'approved'), sql`${colleges.city} IS NOT NULL`, sql`${colleges.city} <> ''`)).groupBy(colleges.city).orderBy(colleges.city),
  ])

  const hasMore = rows.length > limit
  const visibleResults = hasMore ? rows.slice(0, limit) : rows
  const totalCount = Number(totalRows[0]?.total ?? 0)

  const degreeFacets = asFacets(degreeRows)
  const streamFacets = asFacets(streamRows)
  const cityFacets = asFacets(cityRows)
  const stateFacets = asFacets(stateRows)
  const allCities = allCityRows.map((r) => r.value).filter((v): v is string => v !== null)

  const user = await getCurrentUser()
  let userShortlists = new Set<string>()
  if (user?.role === 'student' && visibleResults.length) {
    const shortlistRows = await db.query.shortlists.findMany({ where: and(eq(shortlists.studentId, user.id), inArray(shortlists.collegeId, visibleResults.map((v) => v.id))) })
    userShortlists = new Set(shortlistRows.map((item) => item.collegeId))
  }

  const filters: Record<string, string | string[] | undefined> = {
    q,
    category: category !== 'all' ? category : undefined,
    state,
    city,
    stream: streams,
    collegeType: collegeTypes,
    feeMin,
    feeMax,
    minNirf,
    maxNirf,
    courseLevel: courseLevels,
    sort: isNonDefaultSort ? sort : undefined,
  }

  const selected: Array<{ label: string; href: string }> = []
  if (category !== 'all') selected.push({ label: titleize(category), href: buildPageHref(1, { ...filters, category: undefined }) })
  if (state) selected.push({ label: state, href: buildPageHref(1, { ...filters, state: undefined, city: undefined }) })
  if (city) selected.push({ label: city, href: buildPageHref(1, { ...filters, city: undefined }) })
  streams.forEach((s) => selected.push({ label: s, href: buildPageHref(1, { ...filters, stream: streams.filter((x) => x !== s) }) }))
  collegeTypes.forEach((t) => selected.push({ label: titleize(t), href: buildPageHref(1, { ...filters, collegeType: collegeTypes.filter((x) => x !== t) }) }))

  return (
    <div className="min-h-screen bg-[#FFFBFE]">
      <Suspense fallback={null}>
        <DiscoveryAnalyticsTracker />
      </Suspense>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-b-[48px] bg-md-surface-container py-16">
        {/* Atmospheric blur shapes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-12 h-96 w-96 rounded-full bg-md-primary/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -left-12 h-80 w-80 rounded-full bg-md-tertiary/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <span className="mb-4 inline-block rounded-full bg-md-secondary-container px-4 py-1.5 text-xs font-medium text-md-on-secondary-container">
            Discover Your Future
          </span>
          <h1 className="text-5xl font-medium leading-tight text-md-on-surface">
            Explore Colleges across India
          </h1>
          <p className="mt-3 text-lg text-md-on-surface/60">
            Find the right college for your goals — filter by location, stream, fees, and rankings.
          </p>

          {/* Search bar */}
          <form method="GET" action="/colleges" className="mt-8">
            {category !== 'all' && <input type="hidden" name="category" value={category} />}
            {state && <input type="hidden" name="state" value={state} />}
            {city && <input type="hidden" name="city" value={city} />}
            {streams.length > 0 && <input type="hidden" name="stream" value={streams.join(',')} />}
            {collegeTypes.length > 0 && <input type="hidden" name="collegeType" value={collegeTypes.join(',')} />}
            {courseLevels.length > 0 && (
              <input type="hidden" name="courseLevel" value={courseLevels.join(',')} />
            )}
            <div className="flex h-14 items-center rounded-t-xl border-b-2 border-md-outline bg-md-surface-container-low pr-2 transition-colors duration-200 focus-within:border-md-primary">
              <Search className="ml-4 h-5 w-5 shrink-0 text-md-on-surface-variant" />
              <input
                name="q"
                aria-label="Search colleges by name"
                defaultValue={q || ''}
                placeholder="Search colleges by name..."
                className="flex-1 bg-transparent px-3 text-base text-md-on-surface outline-none placeholder:text-md-on-surface-variant/50"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-md-primary px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-md-primary/90 active:scale-95"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick-filter chips */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
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
            {(['Maharashtra', 'Tamil Nadu', 'Karnataka'] as const).map((st) => (
              <Link
                key={st}
                href={buildPageHref(1, { ...filters, state: state === st ? undefined : st, city: undefined })}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-colors duration-200',
                  state === st
                    ? 'border-transparent bg-md-secondary-container text-md-on-secondary-container'
                    : 'border-md-outline/40 text-md-on-surface-variant hover:bg-md-primary/10',
                )}
              >
                {st}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main layout ── */}
      <div className="mx-auto flex max-w-screen-xl items-start gap-8 px-6 py-8">

        {/* ── Left Sidebar ── */}
        <aside className="sticky top-6 hidden w-[280px] shrink-0 self-start lg:block">
          <div className="rounded-3xl bg-md-surface-container p-6 shadow-sm">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-md-on-surface">Filters</h2>
              <Link
                href={buildPageHref(1, { q })}
                className="rounded-full px-3 py-1 text-sm text-md-primary transition-colors duration-200 hover:bg-md-primary/10"
              >
                Clear all
              </Link>
            </div>
            <div className="mb-4 border-t border-md-outline/20" />

            {/* Active filter chips */}
            {selected.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {selected.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center gap-1 rounded-full bg-md-secondary-container px-3 py-1 text-xs text-md-on-secondary-container transition-colors duration-200 hover:bg-md-secondary-container/80"
                  >
                    {item.label}
                    <X className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            )}

            <div className="space-y-5">
              {/* State */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                  State
                </h3>
                <FilterSelect
                  name="state"
                  value={state}
                  options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                  placeholder="All States"
                  filters={{ ...filters, city: undefined }}
                />
              </div>

              {/* City */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                  City
                </h3>
                <FilterSelect
                  name="city"
                  value={city}
                  options={allCities.map((c) => ({ value: c, label: c }))}
                  placeholder="All Cities"
                  filters={filters}
                />
              </div>

              {/* Stream */}
              {streamFacets.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                    Stream
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {streamFacets.slice(0, 10).map((item) => (
                      <Link
                        key={item.value}
                        href={buildPageHref(1, {
                          ...filters,
                          stream: streams.includes(item.value)
                            ? streams.filter((s) => s !== item.value)
                            : [...streams, item.value],
                        })}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-colors duration-200',
                          streams.includes(item.value)
                            ? 'border-transparent bg-md-secondary-container text-md-on-secondary-container'
                            : 'border-md-outline/30 text-md-on-surface-variant hover:bg-md-primary/10',
                        )}
                      >
                        {item.value
                          .split(/[_\s-]+/)
                          .filter(Boolean)
                          .map((v) => v[0].toUpperCase() + v.slice(1))
                          .join(' ')}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* College Type */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                  College Type
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(['affiliated', 'university', 'autonomous'] as const).map((type) => (
                    <Link
                      key={type}
                      href={buildPageHref(1, {
                        ...filters,
                        collegeType: collegeTypes.includes(type)
                          ? collegeTypes.filter((t) => t !== type)
                          : [...collegeTypes, type],
                      })}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors duration-200',
                        collegeTypes.includes(type)
                          ? 'border-transparent bg-md-secondary-container text-md-on-secondary-container'
                          : 'border-md-outline/30 text-md-on-surface-variant hover:bg-md-primary/10',
                      )}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Course Level */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                  Course Level
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(['ug', 'pg', 'doctorate', 'diploma', 'certification'] as const).map((level) => (
                    <Link
                      key={level}
                      href={buildPageHref(1, {
                        ...filters,
                        courseLevel: courseLevels.includes(level)
                          ? courseLevels.filter((l) => l !== level)
                          : [...courseLevels, level],
                      })}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs transition-colors duration-200',
                        courseLevels.includes(level)
                          ? 'border-transparent bg-md-secondary-container text-md-on-secondary-container'
                          : 'border-md-outline/30 text-md-on-surface-variant hover:bg-md-primary/10',
                      )}
                    >
                      {level.toUpperCase()}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Fee Range */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                  Annual Fee (₹)
                </h3>
                <form method="GET" action="/colleges" className="flex gap-2">
                  {q && <input type="hidden" name="q" value={q} />}
                  {category !== 'all' && <input type="hidden" name="category" value={category} />}
                  {state && <input type="hidden" name="state" value={state} />}
                  {city && <input type="hidden" name="city" value={city} />}
                  {streams.length > 0 && <input type="hidden" name="stream" value={streams.join(',')} />}
                  {collegeTypes.length > 0 && <input type="hidden" name="collegeType" value={collegeTypes.join(',')} />}
                  {courseLevels.length > 0 && (
                    <input type="hidden" name="courseLevel" value={courseLevels.join(',')} />
                  )}
                  {maxNirf && <input type="hidden" name="maxNirf" value={maxNirf} />}
                  {minNirf && <input type="hidden" name="minNirf" value={minNirf} />}
                  {isNonDefaultSort && <input type="hidden" name="sort" value={sort} />}
                  <input
                    name="feeMin"
                    type="number"
                    aria-label="Minimum annual fee"
                    defaultValue={feeMin || ''}
                    placeholder="Min"
                    className="h-10 min-w-0 flex-1 rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-3 text-sm outline-none transition-colors duration-200 focus:border-md-primary"
                  />
                  <input
                    name="feeMax"
                    type="number"
                    aria-label="Maximum annual fee"
                    defaultValue={feeMax || ''}
                    placeholder="Max"
                    className="h-10 min-w-0 flex-1 rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-3 text-sm outline-none transition-colors duration-200 focus:border-md-primary"
                  />
                  <button
                    type="submit"
                    className="h-10 shrink-0 rounded-full bg-md-primary px-4 text-xs text-white transition-all duration-200 hover:bg-md-primary/90 active:scale-95"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* NIRF Rank */}
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">
                  NIRF Rank (Top N)
                </h3>
                <form method="GET" action="/colleges" className="flex gap-2">
                  {q && <input type="hidden" name="q" value={q} />}
                  {category !== 'all' && <input type="hidden" name="category" value={category} />}
                  {state && <input type="hidden" name="state" value={state} />}
                  {city && <input type="hidden" name="city" value={city} />}
                  {streams.length > 0 && <input type="hidden" name="stream" value={streams.join(',')} />}
                  {collegeTypes.length > 0 && <input type="hidden" name="collegeType" value={collegeTypes.join(',')} />}
                  {courseLevels.length > 0 && (
                    <input type="hidden" name="courseLevel" value={courseLevels.join(',')} />
                  )}
                  {feeMin && <input type="hidden" name="feeMin" value={feeMin} />}
                  {feeMax && <input type="hidden" name="feeMax" value={feeMax} />}
                  {isNonDefaultSort && <input type="hidden" name="sort" value={sort} />}
                  <input
                    name="maxNirf"
                    type="number"
                    aria-label="Maximum NIRF rank"
                    defaultValue={maxNirf || ''}
                    placeholder="e.g. 50"
                    className="h-10 flex-1 rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-3 text-sm outline-none transition-colors duration-200 focus:border-md-primary"
                  />
                  <button
                    type="submit"
                    className="h-10 shrink-0 rounded-full bg-md-primary px-4 text-xs text-white transition-all duration-200 hover:bg-md-primary/90 active:scale-95"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.map((tab) => (
                <Link
                  key={tab.value}
                  href={buildPageHref(1, {
                    ...filters,
                    category: tab.value === 'all' ? undefined : tab.value,
                  })}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-5 text-sm font-medium transition-all duration-200',
                    category === tab.value
                      ? 'bg-md-primary text-white'
                      : 'border border-md-outline/40 text-md-primary hover:bg-md-primary/10',
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-md-on-surface-variant">
                {totalCount.toLocaleString('en-IN')} colleges found
              </span>
              {/* Sort links */}
              <div className="flex gap-1">
                {([
                  { label: 'Relevance', value: defaultSort },
                  { label: 'NIRF', value: 'nirf_asc' as SortOption },
                  { label: 'Fee ↑', value: 'fee_low' as SortOption },
                  { label: 'Fee ↓', value: 'fee_high' as SortOption },
                ] as const).map((item) => (
                  <Link
                    key={item.label}
                    href={buildPageHref(1, {
                      ...filters,
                      sort: item.value === defaultSort ? undefined : item.value,
                    })}
                    className={cn(
                      'inline-flex h-9 items-center rounded-full px-3 text-xs font-medium transition-all duration-200',
                      sort === item.value
                        ? 'bg-md-primary text-white'
                        : 'border border-md-outline/40 text-md-on-surface-variant hover:bg-md-primary/10',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile filter disclosure */}
          <div className="mb-4 lg:hidden">
            <details className="rounded-3xl bg-md-surface-container p-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-md-on-surface [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters
                  {selected.length > 0 && (
                    <span className="rounded-full bg-md-primary px-2 py-0.5 text-xs text-white">
                      {selected.length}
                    </span>
                  )}
                </span>
                <ChevronDown className="h-4 w-4 text-md-on-surface-variant" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm text-md-on-surface-variant">
                Switch to desktop view for full filter controls.
              </p>
            </details>
          </div>

          {/* Results */}
          <h2 className="sr-only">College Results</h2>
          {visibleResults.length === 0 ? (
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

          {/* Pagination */}
          {visibleResults.length > 0 && (
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
        </div>
      </div>
    </div>
  )
}
