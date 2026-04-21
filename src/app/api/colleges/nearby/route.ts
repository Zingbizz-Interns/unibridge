import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { colleges } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radiusKm = Math.max(1, parseFloat(searchParams.get('radius') || '50'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 })
    }

    const radiusMeters = radiusKm * 1000

    const results = await db.select({
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      city: colleges.city,
      state: colleges.state,
      logoUrl: colleges.logoUrl,
      nirfRank: colleges.nirfRank,
      type: colleges.type,
      distance: sql<number>`ST_Distance(location::geography, ST_MakePoint(${lng}, ${lat})::geography)`
    })
    .from(colleges)
    .where(and(
      eq(colleges.verificationStatus, 'approved'),
      sql`ST_DWithin(location::geography, ST_MakePoint(${lng}, ${lat})::geography, ${radiusMeters})`
    ))
    .orderBy(sql`ST_Distance(location::geography, ST_MakePoint(${lng}, ${lat})::geography) ASC`)
    .limit(limit)

    return NextResponse.json({ success: true, count: results.length, data: results })
  } catch (error: unknown) {
    console.error('Error in nearby colleges search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
