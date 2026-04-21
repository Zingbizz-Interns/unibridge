import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getComparedColleges, parseCompareIds } from '@/lib/college-compare'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ids = parseCompareIds(searchParams.get('ids'), { min: 2, max: 3 })
    const colleges = await getComparedColleges(ids)

    if (!colleges) {
      return NextResponse.json(
        { error: 'One or more colleges could not be compared.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      colleges,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid compare request.' },
        { status: 400 }
      )
    }

    console.error('College compare error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
