import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { enquiries } from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { markEnquiryReadSchema } from '@/validators/enquiry'

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

    const college = await getCollegeRecordForUser(session.user.id)

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    const { id } = await params
    const { read } = markEnquiryReadSchema.parse(await req.json())

    const [updatedEnquiry] = await db
      .update(enquiries)
      .set({
        readAt: read ? new Date() : null,
      })
      .where(
        and(
          eq(enquiries.id, id),
          eq(enquiries.collegeId, college.id)
        )
      )
      .returning({ id: enquiries.id, readAt: enquiries.readAt })

    if (!updatedEnquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      enquiry: {
        id: updatedEnquiry.id,
        isRead: updatedEnquiry.readAt !== null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid request.' },
        { status: 400 }
      )
    }

    console.error('College enquiry update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
