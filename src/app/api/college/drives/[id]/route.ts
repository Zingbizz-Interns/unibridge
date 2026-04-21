import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { ZodError } from 'zod'
import { campusDrives } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { campusDriveSchema } from '@/validators/campus-drive'

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
    const data = campusDriveSchema.parse(await req.json())

    const [drive] = await db
      .update(campusDrives)
      .set({
        companyName: data.companyName,
        role: data.role ?? null,
        ctc: data.ctc !== undefined ? data.ctc.toFixed(2) : null,
        driveDate: data.driveDate,
        studentsPlaced: data.studentsPlaced ?? null,
      })
      .where(
        and(
          eq(campusDrives.id, id),
          eq(campusDrives.collegeId, result.college.id)
        )
      )
      .returning()

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, drive })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid drive data' },
        { status: 400 }
      )
    }

    console.error('Drive update error:', error)
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

    const [drive] = await db
      .delete(campusDrives)
      .where(
        and(
          eq(campusDrives.id, id),
          eq(campusDrives.collegeId, result.college.id)
        )
      )
      .returning({ id: campusDrives.id })

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Drive delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
