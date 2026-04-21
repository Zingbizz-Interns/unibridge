import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
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

export async function GET() {
  const result = await getAuthenticatedCollege()

  if ('error' in result) {
    return result.error
  }

  const drives = await db
    .select()
    .from(campusDrives)
    .where(eq(campusDrives.collegeId, result.college.id))
    .orderBy(desc(campusDrives.driveDate), desc(campusDrives.createdAt))

  return NextResponse.json({ success: true, drives })
}

export async function POST(req: Request) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const data = campusDriveSchema.parse(await req.json())

    const [drive] = await db
      .insert(campusDrives)
      .values({
        collegeId: result.college.id,
        companyName: data.companyName,
        role: data.role ?? null,
        ctc: data.ctc !== undefined ? data.ctc.toFixed(2) : null,
        driveDate: data.driveDate,
        studentsPlaced: data.studentsPlaced ?? null,
      })
      .returning()

    return NextResponse.json({ success: true, drive }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid drive data' },
        { status: 400 }
      )
    }

    console.error('Drive create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
