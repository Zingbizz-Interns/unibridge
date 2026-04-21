// src/app/api/college/profile/route.ts
import { NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { colleges } from '@/db/schema'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { collegeProfileSchema } from '@/validators/college-profile'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = collegeProfileSchema.parse(await req.json())

    const college = await db.query.colleges.findFirst({
      where: eq(colleges.userId, session.user.id),
      columns: { id: true },
    })

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    await db
      .update(colleges)
      .set({
        name: data.name,
        category: data.category ?? null,
        collegeType: data.collegeType ?? null,
        type: data.type ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        pincode: data.pincode ?? null,
        affiliation: data.affiliation ?? null,
        naacGrade: data.naacGrade ?? null,
        nirfRank: data.nirfRank ?? null,
        engineeringCutoff:
          data.engineeringCutoff !== undefined ? String(data.engineeringCutoff) : null,
        medicalCutoff:
          data.medicalCutoff !== undefined ? String(data.medicalCutoff) : null,
        website: data.website ?? null,
        description: data.description ?? null,
        counsellorEmail: data.counsellorEmail ?? null,
        counsellorPhone: data.counsellorPhone ?? null,
        location:
          data.latitude !== undefined && data.longitude !== undefined
            ? sql`ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`
            : null,
      })
      .where(eq(colleges.id, college.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    console.error('College profile update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
