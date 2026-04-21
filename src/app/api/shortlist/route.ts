import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shortlists, colleges } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const myList = await db.select({
      shortlistId: shortlists.id,
      createdAt: shortlists.createdAt,
      college: {
        id: colleges.id,
        name: colleges.name,
        slug: colleges.slug,
        city: colleges.city,
        state: colleges.state,
        logoUrl: colleges.logoUrl,
      }
    })
    .from(shortlists)
    .innerJoin(colleges, eq(shortlists.collegeId, colleges.id))
    .where(eq(shortlists.studentId, user.id))
    .orderBy(desc(shortlists.createdAt))

    return NextResponse.json({ success: true, data: myList })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { collegeId } = await req.json()
    if (!collegeId) {
      return NextResponse.json({ error: 'Missing collegeId' }, { status: 400 })
    }

    const college = await db.query.colleges.findFirst({
      where: and(
        eq(colleges.id, collegeId),
        eq(colleges.verificationStatus, 'approved')
      )
    })

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    await db.insert(shortlists).values({
      studentId: user.id,
      collegeId
    }).onConflictDoNothing({
      target: [shortlists.studentId, shortlists.collegeId]
    })

    return NextResponse.json({ success: true, message: 'Added to shortlist' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const collegeId = searchParams.get('collegeId')

    if (!collegeId) {
      return NextResponse.json({ error: 'Missing collegeId' }, { status: 400 })
    }

    await db.delete(shortlists).where(and(
      eq(shortlists.studentId, user.id),
      eq(shortlists.collegeId, collegeId)
    ))

    return NextResponse.json({ success: true, message: 'Removed from shortlist' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
