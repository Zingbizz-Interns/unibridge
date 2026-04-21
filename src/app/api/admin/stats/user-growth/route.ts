import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserGrowth } from '@/lib/admin-dashboard'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const series = await getUserGrowth()
    return NextResponse.json({ series })
  } catch (error) {
    console.error('Admin user growth error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
