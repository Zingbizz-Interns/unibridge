import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents } from '@/db/schema'
import { storageAdmin } from '@/lib/storage'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode')
    const document = await db.query.documents.findFirst({
      columns: {
        id: true,
        fileName: true,
        storageBucket: true,
        storagePath: true,
      },
      where: eq(documents.id, id),
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const { data, error } = await storageAdmin.storage
      .from(document.storageBucket)
      .createSignedUrl(
        document.storagePath,
        60 * 10,
        mode === 'preview'
          ? undefined
          : {
              download: document.fileName || undefined,
            }
      )

    if (error || !data?.signedUrl) {
      console.error('Supabase signed download error:', error)
      return NextResponse.json({ error: 'Failed to generate document URL' }, { status: 500 })
    }

    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    console.error('Admin document download error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
