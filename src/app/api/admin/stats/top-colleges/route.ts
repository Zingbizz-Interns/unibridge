import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTopColleges } from '@/lib/admin-dashboard'

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const colleges = await getTopColleges()
    return NextResponse.json({ colleges })
  } catch (error) {
    console.error('Admin top colleges error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
