import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getAdminStudents, parsePositivePage } from '@/lib/admin-dashboard'

const querySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional(),
})

const PAGE_SIZE = 20

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const { search, page } = querySchema.parse({
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
    })

    const currentPage = parsePositivePage(page)
    const result = await getAdminStudents({
      search,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    return NextResponse.json({
      students: result.students,
      total: result.total,
      page: currentPage,
      limit: PAGE_SIZE,
      search: search?.trim() || '',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Admin students list error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
