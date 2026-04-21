import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { ZodError } from 'zod'
import { successStories } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { storageBuckets } from '@/lib/storage'
import { getStoragePublicUrl, getStorageReadableUrl } from '@/lib/storage-utils'
import { createSuccessStorySchema } from '@/validators/success-story'

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

  const stories = await db
    .select()
    .from(successStories)
    .where(eq(successStories.collegeId, result.college.id))
    .orderBy(desc(successStories.createdAt))

  const storiesWithReadableImages = await Promise.all(
    stories.map(async (story) => ({
      ...story,
      imageUrl:
        (await getStorageReadableUrl(story.imageBucket, story.imagePath)) ?? story.imageUrl,
    }))
  )

  return NextResponse.json({ success: true, stories: storiesWithReadableImages })
}

export async function POST(req: Request) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const data = createSuccessStorySchema.parse(await req.json())
    const imageBucket = storageBuckets.stories
    const imageUrl = getStoragePublicUrl(imageBucket, data.imagePath)

    const [story] = await db
      .insert(successStories)
      .values({
        collegeId: result.college.id,
        studentName: data.studentName,
        batch: data.batch,
        company: data.company,
        role: data.role ?? null,
        ctc: data.ctc !== undefined ? data.ctc.toFixed(2) : null,
        imageBucket,
        imagePath: data.imagePath,
        imageUrl,
        story: data.story,
      })
      .returning()

    const readableImageUrl =
      (await getStorageReadableUrl(story.imageBucket, story.imagePath)) ?? story.imageUrl

    return NextResponse.json(
      { success: true, story: { ...story, imageUrl: readableImageUrl } },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid success story data' },
        { status: 400 }
      )
    }

    console.error('Success story create error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
