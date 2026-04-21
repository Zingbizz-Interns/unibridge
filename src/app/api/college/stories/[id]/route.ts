import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { ZodError } from 'zod'
import { successStories } from '@/db/schema'
import { auth } from '@/lib/auth'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { storageBuckets } from '@/lib/storage'
import { getStoragePublicUrl, getStorageReadableUrl, removeStorageObjects } from '@/lib/storage-utils'
import { updateSuccessStorySchema } from '@/validators/success-story'

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthenticatedCollege()

    if ('error' in result) {
      return result.error
    }

    const { id } = await params
    const data = updateSuccessStorySchema.parse(await req.json())

    const [existingStory] = await db
      .select({
        id: successStories.id,
        imageBucket: successStories.imageBucket,
        imagePath: successStories.imagePath,
        imageUrl: successStories.imageUrl,
      })
      .from(successStories)
      .where(
        and(
          eq(successStories.id, id),
          eq(successStories.collegeId, result.college.id)
        )
      )
      .limit(1)

    if (!existingStory) {
      return NextResponse.json({ error: 'Success story not found' }, { status: 404 })
    }

    const nextImagePath = data.imagePath ?? existingStory.imagePath
    const nextImageBucket = nextImagePath ? storageBuckets.stories : existingStory.imageBucket
    const nextImageUrl = nextImagePath
      ? getStoragePublicUrl(nextImageBucket || storageBuckets.stories, nextImagePath)
      : existingStory.imageUrl

    const [story] = await db
      .update(successStories)
      .set({
        studentName: data.studentName,
        batch: data.batch,
        company: data.company,
        role: data.role ?? null,
        ctc: data.ctc !== undefined ? data.ctc.toFixed(2) : null,
        imageBucket: nextImagePath ? nextImageBucket : existingStory.imageBucket,
        imagePath: nextImagePath ?? null,
        imageUrl: typeof nextImageUrl === 'string' ? nextImageUrl : null,
        story: data.story,
      })
      .where(
        and(
          eq(successStories.id, id),
          eq(successStories.collegeId, result.college.id)
        )
      )
      .returning()

    if (
      data.imagePath &&
      existingStory.imagePath &&
      existingStory.imageBucket &&
      existingStory.imagePath !== data.imagePath
    ) {
      try {
        await removeStorageObjects(existingStory.imageBucket, [existingStory.imagePath])
      } catch (storageError) {
        console.error('Old story image cleanup error:', storageError)
      }
    }

    const readableImageUrl =
      (await getStorageReadableUrl(story.imageBucket, story.imagePath)) ?? story.imageUrl

    return NextResponse.json({
      success: true,
      story: {
        ...story,
        imageUrl: readableImageUrl,
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid success story data' },
        { status: 400 }
      )
    }

    console.error('Success story update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
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

    const [story] = await db
      .delete(successStories)
      .where(
        and(
          eq(successStories.id, id),
          eq(successStories.collegeId, result.college.id)
        )
      )
      .returning({
        id: successStories.id,
        imageBucket: successStories.imageBucket,
        imagePath: successStories.imagePath,
      })

    if (!story) {
      return NextResponse.json({ error: 'Success story not found' }, { status: 404 })
    }

    if (story.imageBucket && story.imagePath) {
      try {
        await removeStorageObjects(story.imageBucket, [story.imagePath])
      } catch (storageError) {
        console.error('Story image delete error:', storageError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Success story delete error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
