import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { colleges } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET() {
  const rows = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      city: colleges.city,
      state: colleges.state,
    })
    .from(colleges)
    .where(eq(colleges.verificationStatus, 'approved'))
    .orderBy(asc(colleges.name))

  return NextResponse.json(rows, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
  })
}
