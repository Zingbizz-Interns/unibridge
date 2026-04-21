import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { ZodError } from 'zod'
import { documents } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { storageBuckets } from '@/lib/storage'
import { getStoragePublicUrl } from '@/lib/storage-utils'
import { publicDocumentSchema } from '@/validators/public-document'

async function getAuthenticatedCollege() {
  const session = await auth()

  if (!session || session.user.role !== 'college') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const college = await getCollegeRecordForUser(session.user.id)

  if (!college) {
    return { error: NextResponse.json({ error: 'College profile not found' }, { status: 404 }) }
  }

  return { college }
}

export async function GET() {
  const result = await getAuthenticatedCollege()

  if ('error' in result) {
    return result.error
  }

  const docs = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.collegeId, result.college.id),
        eq(documents.storageBucket, storageBuckets.publicDocuments)
      )
    )
    .orderBy(desc(documents.uploadedAt))

  return NextResponse.json({ success: true, documents: docs })
}

export async function POST(req: Request) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const data = publicDocumentSchema.parse(await req.json())
    const publicUrl = getStoragePublicUrl(storageBuckets.publicDocuments, data.storagePath)

    const [document] = await db
      .insert(documents)
      .values({
        collegeId: result.college.id,
        type: data.type,
        fileName: data.fileName,
        storageBucket: storageBuckets.publicDocuments,
        storagePath: data.storagePath,
        publicUrl,
      })
      .returning()

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid document data' },
        { status: 400 }
      )
    }

    console.error('Public document create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
