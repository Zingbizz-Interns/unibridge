import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import {
  getAdminCollegeList,
  getAdminCollegeStatusFilter,
  parsePositivePage,
} from '@/lib/admin-dashboard'

const querySchema = z.object({
  status: z.string().optional(),
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
    const { status, search, page } = querySchema.parse({
      status: searchParams.get('status') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
    })

    const currentPage = parsePositivePage(page)
    const statusFilter = getAdminCollegeStatusFilter(status)
    const result = await getAdminCollegeList({
      status: statusFilter,
      search,
      page: currentPage,
      pageSize: PAGE_SIZE,
    })

    return NextResponse.json({
      colleges: result.colleges,
      total: result.total,
      page: currentPage,
      limit: PAGE_SIZE,
      status: statusFilter,
      search: search?.trim() || '',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Admin colleges list error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
