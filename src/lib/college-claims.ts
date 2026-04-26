import 'server-only'
import { db } from '@/lib/db'
import { colleges, collegeClaims, users } from '@/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'

export async function getClaimByUserId(userId: string) {
  return db.query.collegeClaims.findFirst({
    where: eq(collegeClaims.userId, userId),
    orderBy: desc(collegeClaims.createdAt),
    with: {
      college: {
        columns: { id: true, name: true, city: true, state: true },
      },
    },
  })
}

export async function hasActiveClaimForCollege(collegeId: string) {
  const existing = await db.query.collegeClaims.findFirst({
    where: and(
      eq(collegeClaims.collegeId, collegeId),
      inArray(collegeClaims.status, ['pending', 'approved'])
    ),
    columns: { id: true, status: true },
  })
  return existing ?? null
}

export async function createClaim({
  collegeId,
  userId,
  adminName,
  adminPhone,
  counsellorName,
  counsellorPhone,
}: {
  collegeId: string
  userId: string
  adminName: string
  adminPhone: string
  counsellorName?: string
  counsellorPhone?: string
}) {
  const [claim] = await db
    .insert(collegeClaims)
    .values({ collegeId, userId, adminName, adminPhone, counsellorName, counsellorPhone })
    .returning()
  return claim
}

export async function approveClaim(claimId: string) {
  await db.transaction(async (tx) => {
    const [claim] = await tx
      .select()
      .from(collegeClaims)
      .where(eq(collegeClaims.id, claimId))
      .limit(1)

    if (!claim) throw new Error('Claim not found')
    if (claim.status !== 'pending') throw new Error('Claim already reviewed')

    await tx
      .update(collegeClaims)
      .set({ status: 'approved', reviewedAt: new Date() })
      .where(eq(collegeClaims.id, claimId))

    await tx
      .update(colleges)
      .set({
        userId: claim.userId,
        counsellorName: claim.counsellorName,
        counsellorPhone: claim.counsellorPhone,
      })
      .where(eq(colleges.id, claim.collegeId))
  })
}

export async function rejectClaim(claimId: string, reason?: string) {
  await db
    .update(collegeClaims)
    .set({ status: 'rejected', rejectionReason: reason ?? null, reviewedAt: new Date() })
    .where(eq(collegeClaims.id, claimId))
}

export async function getPendingClaimsForAdmin() {
  const rows = await db
    .select({
      id: collegeClaims.id,
      status: collegeClaims.status,
      adminName: collegeClaims.adminName,
      adminPhone: collegeClaims.adminPhone,
      counsellorName: collegeClaims.counsellorName,
      counsellorPhone: collegeClaims.counsellorPhone,
      createdAt: collegeClaims.createdAt,
      collegeName: colleges.name,
      collegeCity: colleges.city,
      collegeState: colleges.state,
      userEmail: users.email,
    })
    .from(collegeClaims)
    .innerJoin(colleges, eq(collegeClaims.collegeId, colleges.id))
    .innerJoin(users, eq(collegeClaims.userId, users.id))
    .where(eq(collegeClaims.status, 'pending'))
    .orderBy(collegeClaims.createdAt)

  return rows
}
