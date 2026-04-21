import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTrendingStats } from '@/lib/admin-dashboard'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getTrendingStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin trending stats error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
