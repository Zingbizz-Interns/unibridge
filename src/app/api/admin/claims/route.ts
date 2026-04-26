import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPendingClaimsForAdmin } from '@/lib/college-claims'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const claims = await getPendingClaimsForAdmin()
  return NextResponse.json(claims)
}
