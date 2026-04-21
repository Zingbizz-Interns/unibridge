import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getCollegeEnquiries } from '@/lib/college-enquiries'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { collegeEnquiryFilterSchema } from '@/validators/enquiry'

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'college') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const college = await getCollegeRecordForUser(session.user.id)

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const { filter } = collegeEnquiryFilterSchema.parse({
      filter: searchParams.get('filter') ?? 'all',
    })

    const data = await getCollegeEnquiries({
      collegeId: college.id,
      filter,
    })

    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid enquiry filter.' },
        { status: 400 }
      )
    }

    console.error('College enquiries fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
