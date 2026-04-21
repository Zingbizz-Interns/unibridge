import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { storageAdmin, storageBuckets } from '@/lib/storage'
import { z } from 'zod'

const maxFileSizeBytes = 10 * 1024 * 1024
const uploadBuckets = ['verification', 'publicDocuments', 'stories'] as const
type UploadBucketKey = (typeof uploadBuckets)[number]

const signUploadSchema = z.object({
  fileName: z.string().trim().min(1, 'File name is required'),
  contentType: z.string().trim().min(1, 'Content type is required'),
  size: z.number().int().positive().max(maxFileSizeBytes).optional(),
  bucket: z.enum(uploadBuckets).default('verification'),
})

function isAllowedContentType(contentType: string, bucket: UploadBucketKey) {
  switch (bucket) {
    case 'publicDocuments':
      return contentType === 'application/pdf'
    case 'stories':
      return contentType.startsWith('image/')
    case 'verification':
    default:
      return contentType === 'application/pdf' || contentType.startsWith('image/')
  }
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileName, contentType, bucket } = signUploadSchema.parse(await req.json())

    if (!isAllowedContentType(contentType, bucket)) {
      const message =
        bucket === 'publicDocuments'
          ? 'Invalid file type. Only PDFs are allowed.'
          : bucket === 'stories'
            ? 'Invalid file type. Only images are allowed.'
            : 'Invalid file type. Only PDFs and images are allowed.'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const bucketName = storageBuckets[bucket]
    const fileExt = fileName.split('.').pop() || 'bin'
    const baseName = sanitizeFileName(fileName.replace(/\.[^.]+$/, '')) || 'upload'
    const path = `${session.user.id}/${Date.now()}-${baseName}.${fileExt}`

    const { data, error } = await storageAdmin.storage
      .from(bucketName)
      .createSignedUploadUrl(path)

    if (error) {
      console.error('Supabase signed URL error:', error)
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      token: data.token,
      bucket: bucketName,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Invalid upload request' },
        { status: 400 }
      )
    }

    console.error('Storage sign upload error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
