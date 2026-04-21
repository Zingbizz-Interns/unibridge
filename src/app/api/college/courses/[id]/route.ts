import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const { id } = await params
    const data = courseSchema.parse(await req.json())

    const [course] = await db
      .update(courses)
      .set({
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
      .where(and(eq(courses.id, id), eq(courses.collegeId, result.college.id)))
      .returning()

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, course })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid course data' },
        { status: 400 }
      )
    }

    console.error('Course update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const { id } = await params

    const [course] = await db
      .delete(courses)
      .where(and(eq(courses.id, id), eq(courses.collegeId, result.college.id)))
      .returning({ id: courses.id })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Course delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
