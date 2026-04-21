import 'server-only'

import { and, asc, eq, isNotNull, or } from 'drizzle-orm'
import { colleges } from '@/db/schema'
import { db } from '@/lib/db'
import { type CutoffCollege } from '@/lib/cutoff'

let hasLoggedMissingCutoffColumnsWarning = false

function parseNumericCutoff(value: string | number | null) {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function isMissingCutoffColumnsError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as {
    code?: unknown
    message?: unknown
    cause?: unknown
  }

  if (candidate.code === '42703') {
    return true
  }

  const messages: string[] = []
  if (typeof candidate.message === 'string') {
    messages.push(candidate.message)
  }

  if (candidate.cause && typeof candidate.cause === 'object') {
    const cause = candidate.cause as { code?: unknown; message?: unknown }
    if (cause.code === '42703') {
      return true
    }

    if (typeof cause.message === 'string') {
      messages.push(cause.message)
    }
  }

  const text = messages.join(' ').toLowerCase()
  const mentionsCutoffColumn =
    text.includes('engineering_cutoff') || text.includes('medical_cutoff')

  return text.includes('does not exist') && mentionsCutoffColumn
}

export async function getApprovedCollegesWithCutoffs(): Promise<CutoffCollege[]> {
  try {
    const rows = await db
      .select({
        id: colleges.id,
        name: colleges.name,
        slug: colleges.slug,
        city: colleges.city,
        state: colleges.state,
        type: colleges.type,
        category: colleges.category,
        collegeType: colleges.collegeType,
        nirfRank: colleges.nirfRank,
        engineeringCutoff: colleges.engineeringCutoff,
        medicalCutoff: colleges.medicalCutoff,
      })
      .from(colleges)
      .where(
        and(
          eq(colleges.verificationStatus, 'approved'),
          or(
            isNotNull(colleges.engineeringCutoff),
            isNotNull(colleges.medicalCutoff)
          )
        )
      )
      .orderBy(asc(colleges.nirfRank), asc(colleges.name))

    return rows.map((row) => ({
      ...row,
      engineeringCutoff: parseNumericCutoff(row.engineeringCutoff),
      medicalCutoff: parseNumericCutoff(row.medicalCutoff),
    }))
  } catch (error) {
    if (!isMissingCutoffColumnsError(error)) {
      throw error
    }

    if (!hasLoggedMissingCutoffColumnsWarning) {
      console.warn(
        'Cutoff columns are not available in the current database yet. Returning no cutoff-based suggestions until migrations are applied.'
      )
      hasLoggedMissingCutoffColumnsWarning = true
    }

    return []
  }
}
