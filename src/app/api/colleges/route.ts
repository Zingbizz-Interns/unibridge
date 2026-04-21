import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { colleges, courses, categoryEnum, collegeTypeEnum, courseLevelEnum } from '@/db/schema'
import { eq, and, sql, desc, SQL, gte, lte, inArray, exists } from 'drizzle-orm'
import { paginationSchema } from '@/validators'

const SORT_OPTIONS = ['relevance', 'recent', 'nirf_asc', 'fee_low', 'fee_high'] as const

type SortOption = (typeof SORT_OPTIONS)[number]
type CategoryFilter = (typeof categoryEnum.enumValues)[number]

function parseNumber(value: string | undefined) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function normalizeCategory(rawValue: string | undefined) {
  if (!rawValue) return undefined

  const normalized = rawValue
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (normalized === 'all') return undefined
  if (normalized === 'arts_science' || normalized === 'arts_and_science' || normalized === 'artsandscience') {
    return 'arts_science' as CategoryFilter
  }

  return (categoryEnum.enumValues as readonly string[]).includes(normalized)
    ? (normalized as CategoryFilter)
    : undefined
}

function normalizeCollegeType(rawValue: string | undefined) {
  if (!rawValue) return undefined

  const normalized = rawValue.toLowerCase()

  return (collegeTypeEnum.enumValues as readonly string[]).includes(normalized)
    ? normalized as (typeof collegeTypeEnum.enumValues)[number]
    : undefined
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const readLastParam = (key: string) => {
      const values = searchParams
        .getAll(key)
        .map((value) => value.trim())
        .filter(Boolean)

      if (values.length === 0) return undefined
      return values[values.length - 1]
    }

    const pagination = paginationSchema.safeParse({
      page: readLastParam('page') ?? '1',
      limit: readLastParam('limit') ?? '20',
    })
    const { page, limit } = pagination.success
      ? pagination.data
      : { page: 1, limit: 20 }
    const offset = (page - 1) * limit

    const q = readLastParam('q')
    const rawCategory = readLastParam('category')
    const rawCollegeType = readLastParam('collegeType')
    const state = readLastParam('state')
    const city = readLastParam('city')
    const minNirf = readLastParam('minNirf')
    const maxNirf = readLastParam('maxNirf')
    const sortParam = readLastParam('sort')

    const rawCourseLevel = searchParams
      .getAll('courseLevel')
      .flatMap((value) => value.split(','))
    const courseLevel = rawCourseLevel
      .map((value) => value.trim())
      .filter((value) =>
        (courseLevelEnum.enumValues as readonly string[]).includes(value)
      ) as (typeof courseLevelEnum.enumValues)[number][]
    const stream = readLastParam('stream')
    const feeMin = readLastParam('feeMin')
    const feeMax = readLastParam('feeMax')

    const sort: SortOption = (
      sortParam && (SORT_OPTIONS as readonly string[]).includes(sortParam)
    )
      ? (sortParam as SortOption)
      : q
        ? 'relevance'
        : 'recent'

    const category = normalizeCategory(rawCategory)
    const collegeType = normalizeCollegeType(rawCollegeType)

    const minNirfNumber = parseNumber(minNirf)
    const maxNirfNumber = parseNumber(maxNirf)
    const feeMinNumber = parseNumber(feeMin)
    const feeMaxNumber = parseNumber(feeMax)

    const [effectiveFeeMin, effectiveFeeMax] = (
      feeMinNumber !== undefined
      && feeMaxNumber !== undefined
      && feeMinNumber > feeMaxNumber
    )
      ? [feeMaxNumber, feeMinNumber]
      : [feeMinNumber, feeMaxNumber]

    function buildConditions(options?: {
      skipCategory?: boolean
      skipCollegeType?: boolean
      skipState?: boolean
      skipCourseLevel?: boolean
    }) {
      const conditions: SQL[] = [eq(colleges.verificationStatus, 'approved')]

      if (q) {
        conditions.push(sql`${colleges.name} % ${q}`)
      }

      if (!options?.skipCategory && category) {
        conditions.push(eq(colleges.category, category))
      }

      if (!options?.skipCollegeType && collegeType) {
        conditions.push(eq(colleges.collegeType, collegeType))
      }

      if (!options?.skipState && state) {
        conditions.push(eq(colleges.state, state))
      }

      if (city) {
        conditions.push(eq(colleges.city, city))
      }

      if (minNirfNumber !== undefined) {
        conditions.push(gte(colleges.nirfRank, minNirfNumber))
      }

      if (maxNirfNumber !== undefined) {
        conditions.push(lte(colleges.nirfRank, maxNirfNumber))
      }

      const shouldApplyCourseExists =
        (courseLevel.length > 0 && !options?.skipCourseLevel)
        || Boolean(stream)
        || effectiveFeeMin !== undefined
        || effectiveFeeMax !== undefined

      if (shouldApplyCourseExists) {
      const courseConditions: SQL[] = [eq(courses.collegeId, colleges.id)]

        if (courseLevel.length > 0 && !options?.skipCourseLevel) {
          courseConditions.push(inArray(courses.courseLevel, courseLevel))
        }

        if (stream) {
          const streamQuery = `%${stream}%`
          courseConditions.push(
            sql`(${courses.stream} ILIKE ${streamQuery} OR ${courses.name} ILIKE ${streamQuery} OR ${courses.degree} ILIKE ${streamQuery})`
          )
        }

        if (effectiveFeeMin !== undefined) {
          courseConditions.push(gte(courses.annualFee, String(effectiveFeeMin)))
        }

        if (effectiveFeeMax !== undefined) {
          courseConditions.push(lte(courses.annualFee, String(effectiveFeeMax)))
        }

        conditions.push(
          exists(db.select().from(courses).where(and(...courseConditions)))
        )
      }

      return conditions
    }

    const queryConditions = and(...buildConditions())
    const minAnnualFeeExpression = sql<string | null>`
      (
        SELECT MIN(${courses.annualFee})
        FROM ${courses}
        WHERE ${courses.collegeId} = ${colleges.id}
      )
    `

    const baseQuery = db.select({
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
      ...(q ? { score: sql<number>`similarity(${colleges.name}, ${q})` } : {})
    })
    .from(colleges)
    .where(queryConditions)
    .limit(limit + 1)
    .offset(offset)
    .$dynamic()

    if (sort === 'relevance' && q) {
      baseQuery.orderBy(desc(sql`similarity(${colleges.name}, ${q})`), desc(colleges.createdAt))
    } else if (sort === 'nirf_asc') {
      baseQuery.orderBy(sql`${colleges.nirfRank} ASC NULLS LAST`, desc(colleges.createdAt))
    } else if (sort === 'fee_low') {
      baseQuery.orderBy(sql`${minAnnualFeeExpression} ASC NULLS LAST`, desc(colleges.createdAt))
    } else if (sort === 'fee_high') {
      baseQuery.orderBy(sql`${minAnnualFeeExpression} DESC NULLS LAST`, desc(colleges.createdAt))
    } else {
      baseQuery.orderBy(desc(colleges.createdAt))
    }

    const rows = await baseQuery
    const hasMore = rows.length > limit
    const results = hasMore ? rows.slice(0, limit) : rows

    const [categoryCounts, collegeTypeCounts, courseLevelCounts, stateCounts] = await Promise.all([
      db
        .select({
          value: colleges.category,
          count: sql<number>`count(*)::int`,
        })
        .from(colleges)
        .where(and(...buildConditions({ skipCategory: true })))
        .groupBy(colleges.category),
      db
        .select({
          value: colleges.collegeType,
          count: sql<number>`count(*)::int`,
        })
        .from(colleges)
        .where(and(...buildConditions({ skipCollegeType: true })))
        .groupBy(colleges.collegeType),
      db
        .select({
          value: courses.courseLevel,
          count: sql<number>`count(distinct ${colleges.id})::int`,
        })
        .from(colleges)
        .innerJoin(courses, eq(courses.collegeId, colleges.id))
        .where(and(...buildConditions({ skipCourseLevel: true })))
        .groupBy(courses.courseLevel),
      db
        .select({
          value: colleges.state,
          count: sql<number>`count(*)::int`,
        })
        .from(colleges)
        .where(and(...buildConditions({ skipState: true })))
        .groupBy(colleges.state),
    ])

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
      page,
      limit,
      hasMore,
      meta: {
        sort,
        selectedFilters: {
          q,
          category,
          state,
          city,
          collegeType,
          courseLevel,
          stream,
          feeMin,
          feeMax,
          minNirf,
          maxNirf,
        },
        availableFilters: {
          categories: categoryCounts
            .filter((row) => row.value !== null)
            .map((row) => ({ value: row.value, count: row.count })),
          collegeTypes: collegeTypeCounts
            .filter((row) => row.value !== null)
            .map((row) => ({ value: row.value, count: row.count })),
          courseLevels: courseLevelCounts
            .filter((row) => row.value !== null)
            .map((row) => ({ value: row.value, count: row.count })),
          states: stateCounts
            .filter((row) => row.value !== null)
            .map((row) => ({ value: row.value, count: row.count })),
        },
      },
    }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching colleges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
