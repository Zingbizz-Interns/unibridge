import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  analyticsEvents,
  applicationStatusHistory,
  applications,
  colleges,
  courses,
  users,
} from '@/db/schema'
import { applicationSchema } from '@/validators/application'
import { sendMail } from '@/lib/mail'

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  )
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = applicationSchema.parse(body)
    const studentName = session.user.name || 'Student'

    const collegeInfoArray = await db
      .select({
        email: users.email,
        counsellorEmail: colleges.counsellorEmail,
        name: colleges.name,
        verificationStatus: colleges.verificationStatus,
      })
      .from(colleges)
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(eq(colleges.id, validatedData.collegeId))
      .limit(1)

    if (
      collegeInfoArray.length === 0 ||
      collegeInfoArray[0].verificationStatus !== 'approved'
    ) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    const courseInfoArray = await db
      .select({
        id: courses.id,
        name: courses.name,
        degree: courses.degree,
      })
      .from(courses)
      .where(
        and(
          eq(courses.id, validatedData.courseId),
          eq(courses.collegeId, validatedData.collegeId)
        )
      )
      .limit(1)

    if (courseInfoArray.length === 0) {
      return NextResponse.json(
        { error: 'Please select a valid course for this college.' },
        { status: 400 }
      )
    }

    const existingApplication = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.studentId, session.user.id),
          eq(applications.collegeId, validatedData.collegeId)
        )
      )
      .limit(1)

    if (existingApplication.length > 0) {
      return NextResponse.json(
        { error: 'You have already applied to this college.' },
        { status: 400 }
      )
    }

    const collegeInfo = collegeInfoArray[0]
    const courseInfo = courseInfoArray[0]
    const courseLabel = courseInfo.degree
      ? `${courseInfo.name} (${courseInfo.degree})`
      : courseInfo.name

    // Neon HTTP driver does not support interactive transactions.
    const [application] = await db
      .insert(applications)
      .values({
        studentId: session.user.id,
        ...validatedData,
        tenthPercent: validatedData.tenthPercent.toString(),
        twelfthPercent: validatedData.twelfthPercent.toString(),
        entranceScore:
          validatedData.entranceScore !== null &&
          validatedData.entranceScore !== undefined
            ? validatedData.entranceScore.toString()
            : null,
      })
      .returning({ id: applications.id })

    await db.insert(analyticsEvents).values({
      eventType: 'apply',
      collegeId: validatedData.collegeId,
      userId: session.user.id,
      course: courseLabel,
      meta: {
        courseId: validatedData.courseId,
        source: 'application_form',
      },
    })

    await db
      .update(users)
      .set({
        phone: validatedData.phone,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))

    await db.insert(applicationStatusHistory).values({
      applicationId: application.id,
      status: 'submitted',
      note: 'Application submitted by student.',
      changedByUserId: session.user.id,
    })

    const collegeEmail = collegeInfo.counsellorEmail || collegeInfo.email
    const emailJobs: Array<{ label: string; promise: Promise<unknown> }> = []

    if (session.user.email) {
      emailJobs.push({
        label: 'student confirmation',
        promise: sendMail({
          to: session.user.email,
          subject: `Application Submitted - ${collegeInfo.name}`,
          html: `<p>Dear ${studentName},</p><p>Your application to <strong>${collegeInfo.name}</strong> for <strong>${courseLabel}</strong> has been successfully submitted. Your application ID is <strong>${application.id}</strong>.</p><p>You can track the status of your application from your student dashboard.</p><br/>Best,<br/>UniBridge Team`,
        }),
      })
    }

    if (collegeEmail) {
      emailJobs.push({
        label: 'college notification',
        promise: sendMail({
          to: collegeEmail,
          subject: `New Application Received - ${studentName}`,
          html: `<p>Hello,</p><p>You have received a new application from <strong>${studentName}</strong> (${session.user.email || 'email unavailable'}).</p><p>Course: <strong>${courseLabel}</strong></p><p>Application ID: <strong>${application.id}</strong>.</p><p>Please log in to your college dashboard to review the application.</p><br/>Best,<br/>UniBridge Team`,
        }),
      })
    }

    const emailResults = await Promise.allSettled(
      emailJobs.map((job) => job.promise)
    )

    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Failed to send ${emailJobs[index]?.label || 'application'} email:`,
          result.reason
        )
      }
    })

    return NextResponse.json({ success: true, applicationId: application.id })
  } catch (error: unknown) {
    console.error('Application submission error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid application data' },
        { status: 400 }
      )
    }

    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: 'You have already applied to this college.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
