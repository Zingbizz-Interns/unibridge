import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { colleges, users } from '@/db/schema'
import {
  deleteCollegeCascade,
  updateCollegeVerificationStatus,
} from '@/lib/admin-dashboard'
import { sendCollegeVerificationStatusEmail } from '@/lib/admin-mail'

const patchSchema = z.object({
  action: z.enum(['suspend', 'restore']),
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

    const { id } = await params
    const { action, reason } = patchSchema.parse(await req.json())

    const [college] = await db
      .select({
        id: colleges.id,
        name: colleges.name,
        email: users.email,
        verificationStatus: colleges.verificationStatus,
      })
      .from(colleges)
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(eq(colleges.id, id))
      .limit(1)

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    const nextStatus = action === 'restore' ? 'approved' : 'suspended'

    if (action === 'restore' && college.verificationStatus !== 'suspended') {
      return NextResponse.json(
        { error: 'Only suspended colleges can be restored' },
        { status: 400 }
      )
    }

    await updateCollegeVerificationStatus({
      collegeId: id,
      status: nextStatus,
    })

    if (action === 'suspend') {
      try {
        await sendCollegeVerificationStatusEmail({
          email: college.email,
          collegeName: college.name,
          status: 'suspended',
          reason,
        })
      } catch (mailError) {
        console.error('Failed to send suspended email:', mailError)
      }
    }

    return NextResponse.json({ success: true, status: nextStatus })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Admin college update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const deletedCollege = await deleteCollegeCascade(id)

    if (!deletedCollege) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: deletedCollege.id })
  } catch (error) {
    console.error('Admin college delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
