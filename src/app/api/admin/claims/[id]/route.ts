import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { collegeClaims, colleges, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { approveClaim, rejectClaim } from '@/lib/college-claims'
import { sendClaimApprovedEmail, sendClaimRejectedEmail } from '@/lib/admin-mail'

const schema = z.object({
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

    const { id: claimId } = await params
    const { action, reason } = schema.parse(await req.json())

    // Fetch claim with college + user email
    const rows = await db
      .select({
        claimId: collegeClaims.id,
        status: collegeClaims.status,
        collegeName: colleges.name,
        userEmail: users.email,
      })
      .from(collegeClaims)
      .innerJoin(colleges, eq(collegeClaims.collegeId, colleges.id))
      .innerJoin(users, eq(collegeClaims.userId, users.id))
      .where(eq(collegeClaims.id, claimId))
      .limit(1)

    const claim = rows[0]
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }
    if (claim.status !== 'pending') {
      return NextResponse.json({ error: 'Claim already reviewed' }, { status: 409 })
    }

    if (action === 'approved') {
      await approveClaim(claimId)
      try {
        await sendClaimApprovedEmail({ email: claim.userEmail, collegeName: claim.collegeName })
      } catch {
        // Non-fatal
      }
    } else {
      await rejectClaim(claimId, reason)
      try {
        await sendClaimRejectedEmail({
          email: claim.userEmail,
          collegeName: claim.collegeName,
          reason,
        })
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }

    console.error('Admin claims PATCH error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
