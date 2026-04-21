import { and, count, desc, eq, gte, isNull } from 'drizzle-orm'
import { enquiries } from '@/db/schema'
import { db } from '@/lib/db'

export async function countRecentEnquiriesForEmail({
  email,
  collegeId,
}: {
  email: string
  collegeId: string
}) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [result] = await db
    .select({ total: count() })
    .from(enquiries)
    .where(
      and(
        eq(enquiries.email, email),
        eq(enquiries.collegeId, collegeId),
        gte(enquiries.createdAt, since)
      )
    )

  return result?.total ?? 0
}

export async function getCollegeEnquiries({
  collegeId,
  filter,
}: {
  collegeId: string
  filter: 'all' | 'unread'
}) {
  const whereClause =
    filter === 'unread'
      ? and(eq(enquiries.collegeId, collegeId), isNull(enquiries.readAt))
      : eq(enquiries.collegeId, collegeId)

  const [unreadCountRows, rows] = await Promise.all([
    db
      .select({ total: count() })
      .from(enquiries)
      .where(and(eq(enquiries.collegeId, collegeId), isNull(enquiries.readAt))),
    db
      .select({
        id: enquiries.id,
        name: enquiries.name,
        email: enquiries.email,
        phone: enquiries.phone,
        message: enquiries.message,
        createdAt: enquiries.createdAt,
        readAt: enquiries.readAt,
      })
      .from(enquiries)
      .where(whereClause)
      .orderBy(desc(enquiries.createdAt)),
  ])

  return {
    enquiries: rows.map((row) => ({
      ...row,
      isRead: row.readAt !== null,
      preview:
        row.message && row.message.length > 96
          ? `${row.message.slice(0, 96)}...`
          : row.message || '',
    })),
    unreadCount: unreadCountRows[0]?.total ?? 0,
  }
}
