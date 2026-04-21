import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  getCollegeApplicantCategoryFilter,
  getCollegeApplicantSort,
  getCollegeApplicantStatusFilter,
  getCollegeApplicationsList,
  getCollegeRecordForUser,
  parsePositivePage,
} from '@/lib/college-applications'

const querySchema = z.object({
  status: z.string().optional(),
  course: z.string().optional(),
  category: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'college') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = querySchema.parse({
      status: searchParams.get('status') ?? undefined,
      course: searchParams.get('course') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      page: searchParams.get('page') ?? undefined,
    })

    const college = await getCollegeRecordForUser(session.user.id)

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    const result = await getCollegeApplicationsList({
      collegeId: college.id,
      status: getCollegeApplicantStatusFilter(query.status),
      courseId: query.course || undefined,
      category: getCollegeApplicantCategoryFilter(query.category),
      sort: getCollegeApplicantSort(query.sort),
      page: parsePositivePage(query.page),
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid query' }, { status: 400 })
    }

    console.error('College applications list error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
