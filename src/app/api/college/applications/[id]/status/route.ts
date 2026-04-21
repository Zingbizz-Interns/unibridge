import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  applicationStatusHistory,
  applications,
  colleges,
  courses,
  users,
} from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  backfillApplicationHistoryForIds,
  collegeManagedStatuses,
  getCollegeRecordForUser,
  getStatusUpdateEmail,
} from '@/lib/college-applications'
import { sendMail } from '@/lib/mail'

const updateStatusSchema = z.object({
  status: z.enum(collegeManagedStatuses),
  note: z.string().trim().max(1000).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'college') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { status, note } = updateStatusSchema.parse(await req.json())
    const trimmedNote = note?.trim() || null

    const college = await getCollegeRecordForUser(session.user.id)

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    const [application] = await db
      .select({
        id: applications.id,
        status: applications.status,
        studentId: applications.studentId,
        studentEmail: users.email,
        studentName: users.name,
        courseName: courses.name,
        courseDegree: courses.degree,
        collegeName: colleges.name,
      })
      .from(applications)
      .innerJoin(users, eq(applications.studentId, users.id))
      .innerJoin(colleges, eq(applications.collegeId, colleges.id))
      .leftJoin(courses, eq(applications.courseId, courses.id))
      .where(
        and(
          eq(applications.id, id),
          eq(applications.collegeId, college.id)
        )
      )
      .limit(1)

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status === 'withdrawn') {
      return NextResponse.json(
        { error: 'Withdrawn applications cannot be updated by the college.' },
        { status: 400 }
      )
    }

    if (application.status === status) {
      return NextResponse.json(
        { error: 'Application is already in that status.' },
        { status: 400 }
      )
    }

    await backfillApplicationHistoryForIds([id])

    // Neon HTTP driver does not support interactive transactions.
    await db
      .update(applications)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))

    await db.insert(applicationStatusHistory).values({
      applicationId: id,
      status,
      note: trimmedNote,
      changedByUserId: session.user.id,
    })

    if (application.studentEmail) {
      const courseLabel = application.courseName
        ? application.courseDegree
          ? `${application.courseName} (${application.courseDegree})`
          : application.courseName
        : 'your selected course'

      const email = getStatusUpdateEmail(status, application.collegeName, courseLabel)

      try {
        await sendMail({
          to: application.studentEmail,
          subject: email.subject,
          html: trimmedNote
            ? `${email.html}<p><strong>Note from the college:</strong> ${trimmedNote}</p>`
            : email.html,
        })
      } catch (mailError) {
        console.error('Failed to send application status email:', mailError)
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    console.error('College application status update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
