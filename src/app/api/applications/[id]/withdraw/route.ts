import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { applicationStatusHistory, applications, colleges, users } from '@/db/schema'
import { sendMail } from '@/lib/mail'
import { backfillApplicationHistoryForIds } from '@/lib/college-applications'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const appData = await db
      .select({
        studentId: applications.studentId,
        status: applications.status,
        collegeName: colleges.name,
        collegeEmail: users.email,
        counsellorEmail: colleges.counsellorEmail,
      })
      .from(applications)
      .innerJoin(colleges, eq(applications.collegeId, colleges.id))
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(eq(applications.id, id))
      .limit(1)

    if (appData.length === 0) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const application = appData[0]

    if (application.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (
      application.status !== 'submitted' &&
      application.status !== 'under_review'
    ) {
      return NextResponse.json(
        {
          error:
            'Application can only be withdrawn if it is submitted or under review.',
        },
        { status: 400 }
      )
    }

    await backfillApplicationHistoryForIds([id])

    // Neon HTTP driver does not support interactive transactions.
    await db
      .update(applications)
      .set({ status: 'withdrawn', updatedAt: new Date() })
      .where(eq(applications.id, id))

    await db.insert(applicationStatusHistory).values({
      applicationId: id,
      status: 'withdrawn',
      note: 'Application withdrawn by student.',
      changedByUserId: session.user.id,
    })

    const collegeEmail = application.counsellorEmail || application.collegeEmail

    if (collegeEmail) {
      try {
        await sendMail({
          to: collegeEmail,
          subject: `Application Withdrawn - ${session.user.name || 'Student'}`,
          html: `<p>Hello,</p><p>The application (ID: <strong>${id}</strong>) submitted by <strong>${session.user.name || 'Student'}</strong> for <strong>${application.collegeName}</strong> has been withdrawn by the student.</p><p>No further action is required for this application.</p><br/>Best,<br/>UniBridge Team`,
        })
      } catch (error) {
        console.error('Failed to send withdrawal notification email:', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Withdraw application error:', error)

    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    )
  }
}
