import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { colleges, users } from '@/db/schema'
import { sendCollegeVerificationStatusEmail } from '@/lib/admin-mail'
import { updateCollegeVerificationStatus } from '@/lib/admin-dashboard'

const verifySchema = z.object({
  action: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(1000).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collegeId } = await params
    const { action, reason } = verifySchema.parse(await req.json())

    const collegeResults = await db
      .select({
        id: colleges.id,
        name: colleges.name,
        email: users.email,
      })
      .from(colleges)
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(eq(colleges.id, collegeId))
      .limit(1)

    const college = collegeResults[0]

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    await updateCollegeVerificationStatus({
      collegeId,
      status: action,
    })

    try {
      await sendCollegeVerificationStatusEmail({
        email: college.email,
        collegeName: college.name,
        status: action,
        reason,
      })
    } catch (mailError) {
      console.error('Failed to send status update email:', mailError)
    }

    return NextResponse.json({ success: true, status: action })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }

    console.error('Verify college error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
