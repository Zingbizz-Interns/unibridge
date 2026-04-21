import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { colleges, courses } from '@/db/schema'
import { db } from '@/lib/db'

export const compareCollegeQueryParamSchema = z
  .string()
  .trim()
  .min(1, 'Select at least two colleges to compare.')

function normalizeCompareIds(rawValue: string) {
  return Array.from(
    new Set(
      rawValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function parseNumericValue(value: string | null) {
  if (!value) {
    return null
  }

  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? null : numericValue
}

function courseMatchesDegree(course: { name: string; degree: string | null }, label: string) {
  const normalizedLabel = label.toLowerCase()
  const degree = course.degree?.toLowerCase() || ''
  const name = course.name.toLowerCase()

  if (normalizedLabel === 'b.tech') {
    return degree.includes('b.tech') || degree.includes('btech') || name.includes('b.tech') || name.includes('btech')
  }

  if (normalizedLabel === 'mba') {
    return degree.includes('mba') || name.includes('mba')
  }

  return degree.includes(normalizedLabel) || name.includes(normalizedLabel)
}

export function parseCompareIds(
  rawValue: string | null | undefined,
  options: { min?: number; max?: number } = {}
) {
  const min = options.min ?? 1
  const max = options.max ?? 3
  const validatedValue = compareCollegeQueryParamSchema.parse(rawValue ?? '')
  return z.array(z.uuid()).min(min).max(max).parse(normalizeCompareIds(validatedValue))
}

export type ComparedCollege = {
  id: string
  slug: string
  name: string
  city: string | null
  state: string | null
  logoUrl: string | null
  nirfRank: number | null
  naacGrade: string | null
  category: string | null
  collegeType: string | null
  type: string | null
  affiliation: string | null
  annualFees: {
    btech: number | null
    mba: number | null
  }
  placements: {
    avgPackage: number | null
    placementPercent: number | null
  }
  availableCourses: string[]
}

export async function getComparedColleges(ids: string[]) {
  const collegeRows = await db
    .select({
      id: colleges.id,
      slug: colleges.slug,
      name: colleges.name,
      city: colleges.city,
      state: colleges.state,
      logoUrl: colleges.logoUrl,
      nirfRank: colleges.nirfRank,
      naacGrade: colleges.naacGrade,
      category: colleges.category,
      collegeType: colleges.collegeType,
      type: colleges.type,
      affiliation: colleges.affiliation,
    })
    .from(colleges)
    .where(
      and(
        inArray(colleges.id, ids),
        eq(colleges.verificationStatus, 'approved')
      )
    )

  if (collegeRows.length !== ids.length) {
    return null
  }

  const courseRows = await db
    .select({
      collegeId: courses.collegeId,
      name: courses.name,
      degree: courses.degree,
      annualFee: courses.annualFee,
      placementPercent: courses.placementPercent,
      avgPackage: courses.avgPackage,
    })
    .from(courses)
    .where(inArray(courses.collegeId, ids))

  const coursesByCollege = courseRows.reduce<Record<string, typeof courseRows>>((accumulator, course) => {
    if (!accumulator[course.collegeId]) {
      accumulator[course.collegeId] = []
    }
    accumulator[course.collegeId].push(course)
    return accumulator
  }, {})

  const orderedColleges = ids
    .map((id) => collegeRows.find((college) => college.id === id))
    .filter(Boolean)
    .map((college) => {
      const relatedCourses = coursesByCollege[college!.id] ?? []

      const lowestAnnualFeeFor = (label: string) =>
        relatedCourses.reduce<number | null>((lowest, course) => {
          if (!courseMatchesDegree(course, label)) {
            return lowest
          }

          const annualFee = parseNumericValue(course.annualFee)
          if (annualFee === null) {
            return lowest
          }

          return lowest === null ? annualFee : Math.min(lowest, annualFee)
        }, null)

      const bestAvgPackage = relatedCourses.reduce<number | null>((best, course) => {
        const avgPackage = parseNumericValue(course.avgPackage)
        if (avgPackage === null) {
          return best
        }
        return best === null ? avgPackage : Math.max(best, avgPackage)
      }, null)

      const bestPlacementPercent = relatedCourses.reduce<number | null>((best, course) => {
        const placementPercent = parseNumericValue(course.placementPercent)
        if (placementPercent === null) {
          return best
        }
        return best === null ? placementPercent : Math.max(best, placementPercent)
      }, null)

      return {
        ...college!,
        annualFees: {
          btech: lowestAnnualFeeFor('b.tech'),
          mba: lowestAnnualFeeFor('mba'),
        },
        placements: {
          avgPackage: bestAvgPackage,
          placementPercent: bestPlacementPercent,
        },
        availableCourses: Array.from(
          new Set(
            relatedCourses.map((course) =>
              course.degree ? `${course.name} (${course.degree})` : course.name
            )
          )
        ).slice(0, 6),
      } satisfies ComparedCollege
    })

  return orderedColleges
}
