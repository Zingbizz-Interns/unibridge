import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAdminOverviewStats } from '@/lib/admin-dashboard'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getAdminOverviewStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin overview stats error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
