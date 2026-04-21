import { NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { colleges, users } from '@/db/schema'
import { sendCollegeVerificationStatusEmail } from '@/lib/admin-mail'

const bulkApproveSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
})

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = bulkApproveSchema.parse(await req.json())

    const pendingColleges = await db
      .select({
        id: colleges.id,
        name: colleges.name,
        email: users.email,
      })
      .from(colleges)
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(
        and(
          inArray(colleges.id, ids),
          eq(colleges.verificationStatus, 'pending')
        )
      )

    if (pendingColleges.length === 0) {
      return NextResponse.json(
        { error: 'No pending colleges found for approval' },
        { status: 400 }
      )
    }

    const pendingIds = pendingColleges.map((college) => college.id)

    await db
      .update(colleges)
      .set({ verificationStatus: 'approved' })
      .where(inArray(colleges.id, pendingIds))

    await Promise.all(
      pendingColleges.map(async (college) => {
        try {
          await sendCollegeVerificationStatusEmail({
            email: college.email,
            collegeName: college.name,
            status: 'approved',
          })
        } catch (mailError) {
          console.error('Bulk approval email failed:', mailError)
        }
      })
    )

    return NextResponse.json({
      success: true,
      approvedCount: pendingIds.length,
      approvedIds: pendingIds,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Bulk approve colleges error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
