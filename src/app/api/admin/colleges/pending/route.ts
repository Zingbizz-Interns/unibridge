import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAdminCollegeList } from '@/lib/admin-dashboard'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pendingColleges = await getAdminCollegeList({
      status: 'pending',
      page: 1,
      pageSize: 100,
    })

    return NextResponse.json({ colleges: pendingColleges.colleges })
  } catch (error) {
    console.error('Error fetching pending colleges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
