import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { analyticsEvents } from '@/db/schema'
import { getCurrentUser } from '@/lib/session'

export async function POST(req: Request) {
  try {
    const { eventType, collegeId, meta } = await req.json()
    const user = await getCurrentUser()
    
    await db.insert(analyticsEvents).values({
      eventType,
      collegeId,
      userId: user?.id,
      meta,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics insertion error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
