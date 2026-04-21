import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { ZodError } from 'zod'
import { courses } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { courseSchema } from '@/validators/course'

async function getAuthenticatedCollege() {
  const session = await auth()

  if (!session || session.user.role !== 'college') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const college = await getCollegeRecordForUser(session.user.id)

  if (!college) {
    return { error: NextResponse.json({ error: 'College profile not found' }, { status: 404 }) }
  }

  return { college }
}

export async function GET() {
  const result = await getAuthenticatedCollege()

  if ('error' in result) {
    return result.error
  }

  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.collegeId, result.college.id))
    .orderBy(asc(courses.name), asc(courses.degree))

  return NextResponse.json({ success: true, courses: rows })
}

export async function POST(req: Request) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const data = courseSchema.parse(await req.json())

    const [course] = await db
      .insert(courses)
      .values({
        collegeId: result.college.id,
        name: data.name,
        degree: data.degree ?? null,
        duration: data.duration ?? null,
        courseLevel: data.courseLevel ?? null,
        stream: data.stream ?? null,
        totalFee: data.totalFee !== undefined ? data.totalFee.toFixed(2) : null,
        annualFee: data.annualFee !== undefined ? data.annualFee.toFixed(2) : null,
        seats: data.seats ?? null,
        placementPercent:
          data.placementPercent !== undefined ? data.placementPercent.toFixed(2) : null,
        avgPackage: data.avgPackage !== undefined ? data.avgPackage.toFixed(2) : null,
      })
      .returning()

    return NextResponse.json({ success: true, course }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid course data' },
        { status: 400 }
      )
    }

    console.error('Course create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
