import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getApplicationsOverTime } from '@/lib/admin-dashboard'

const querySchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
})

export async function GET(req: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const { period } = querySchema.parse({
      period: searchParams.get('period') ?? '30d',
    })

    const series = await getApplicationsOverTime(period)
    return NextResponse.json({ period, series })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }

    console.error('Admin applications over time error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
