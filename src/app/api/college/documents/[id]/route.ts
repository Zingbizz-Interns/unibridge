import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { documents } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { storageBuckets } from '@/lib/storage'
import { removeStorageObjects } from '@/lib/storage-utils'

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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const { id } = await params

    const [document] = await db
      .delete(documents)
      .where(
        and(
          eq(documents.id, id),
          eq(documents.collegeId, result.college.id),
          eq(documents.storageBucket, storageBuckets.publicDocuments)
        )
      )
      .returning({
        id: documents.id,
        storagePath: documents.storagePath,
      })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    try {
      await removeStorageObjects(storageBuckets.publicDocuments, [document.storagePath])
    } catch (storageError) {
      console.error('Public document delete error:', storageError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Public document delete route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
