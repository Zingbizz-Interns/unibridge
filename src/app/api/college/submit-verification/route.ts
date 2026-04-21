import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { colleges, documents, users } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { verificationDocumentTypes } from '@/lib/college-content'
import { sendMail } from '@/lib/mail'
import { storageBuckets } from '@/lib/storage'

export async function POST() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const college = await db.query.colleges.findFirst({
      where: eq(colleges.userId, session.user.id),
      columns: { id: true, name: true, verificationStatus: true }
    })

    if (!college) {
      return NextResponse.json({ error: 'College profile not found' }, { status: 404 })
    }

    if (college.verificationStatus !== 'rejected' && college.verificationStatus !== 'pending') {
         // Maybe it's already approved, or we default to pending. 
         // If it's approved, let's stop them from returning to pending randomly without cause.
        if (college.verificationStatus === 'approved') {
            return NextResponse.json({ error: 'College is already approved' }, { status: 400 })
        }
    }

    // Check if they uploaded a mandatory document
    const docs = await db.query.documents.findMany({
      where: and(
        eq(documents.collegeId, college.id),
        eq(documents.storageBucket, storageBuckets.verification),
        inArray(documents.type, [...verificationDocumentTypes])
      )
    })

    if (docs.length === 0) {
      return NextResponse.json({ error: 'Must upload at least one verification document (NAAC, AICTE, or UGC)' }, { status: 400 })
    }

    // Update status to pending
    await db.update(colleges)
      .set({ verificationStatus: 'pending' })
      .where(eq(colleges.id, college.id))

    // Notify admins
    const adminUsers = await db.query.users.findMany({
        where: eq(users.role, 'admin'),
        columns: { email: true }
    })

    const emails = adminUsers.map(a => a.email)
    
    if (emails.length > 0) {
        // Send email (best effort)
        try {
            await sendMail({
                to: emails.join(', '),
                subject: 'Action Required: New College Registration',
                html: `<p>A new college <strong>${college.name}</strong> has submitted their registration and documents for verification.</p>
                       <p>Please log in to the admin dashboard to review.</p>`
            })
        } catch (mailError) {
            console.error('Failed to send admin notification:', mailError)
        }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Submit verification error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
