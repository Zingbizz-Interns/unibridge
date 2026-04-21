import { NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { colleges, documents } from '@/db/schema'
import { auth } from '@/lib/auth'
import { verificationDocumentTypes } from '@/lib/college-content'
import { db } from '@/lib/db'
import { storageAdmin, storageBuckets } from '@/lib/storage'

const documentSchema = z.object({
  type: z.enum(verificationDocumentTypes),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, fileName, storagePath } = documentSchema.parse(await req.json())

    const college = await db.query.colleges.findFirst({
      where: eq(colleges.userId, session.user.id),
      columns: { id: true },
    })

    if (!college) {
      return NextResponse.json({ error: 'College not found for this user' }, { status: 404 })
    }

    const existingDocs = await db
      .select({
        id: documents.id,
        storagePath: documents.storagePath,
      })
      .from(documents)
      .where(
        and(
          eq(documents.collegeId, college.id),
          eq(documents.type, type),
          eq(documents.storageBucket, storageBuckets.verification)
        )
      )

    const stalePaths = existingDocs
      .map((doc) => doc.storagePath)
      .filter((path) => path !== storagePath)

    if (stalePaths.length > 0) {
      const { error: storageError } = await storageAdmin.storage
        .from(storageBuckets.verification)
        .remove(stalePaths)

      if (storageError) {
        console.error('Old verification document cleanup error:', storageError)
      }
    }

    let savedDoc

    if (existingDocs.length > 0) {
      const [primaryDoc, ...duplicateDocs] = existingDocs

      const [updatedDoc] = await db
        .update(documents)
        .set({
          fileName,
          storageBucket: storageBuckets.verification,
          storagePath,
          publicUrl: null,
          uploadedAt: new Date(),
        })
        .where(eq(documents.id, primaryDoc.id))
        .returning()

      if (duplicateDocs.length > 0) {
        await db
          .delete(documents)
          .where(inArray(documents.id, duplicateDocs.map((doc) => doc.id)))
      }

      savedDoc = updatedDoc
    } else {
      const [newDoc] = await db
        .insert(documents)
        .values({
          collegeId: college.id,
          type,
          fileName,
          storageBucket: storageBuckets.verification,
          storagePath,
        })
        .returning()

      savedDoc = newDoc
    }

    return NextResponse.json({ success: true, document: savedDoc })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Invalid input' }, { status: 400 })
    }

    console.error('Document save error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
