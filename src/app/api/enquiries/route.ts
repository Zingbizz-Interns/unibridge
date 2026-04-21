import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { colleges, enquiries, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { countRecentEnquiriesForEmail } from '@/lib/college-enquiries'
import { db } from '@/lib/db'
import { sendMail } from '@/lib/mail'
import { enquirySchema } from '@/validators/enquiry'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatMultilineHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br/>')
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (session && session.user.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students or guests can send enquiries.' },
        { status: 403 }
      )
    }

    const data = enquirySchema.parse(await req.json())

    const [college] = await db
      .select({
        id: colleges.id,
        name: colleges.name,
        counsellorEmail: colleges.counsellorEmail,
        ownerEmail: users.email,
        verificationStatus: colleges.verificationStatus,
      })
      .from(colleges)
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(eq(colleges.id, data.collegeId))
      .limit(1)

    if (!college || college.verificationStatus !== 'approved') {
      return NextResponse.json({ error: 'College not found.' }, { status: 404 })
    }

    const recentCount = await countRecentEnquiriesForEmail({
      email: data.email,
      collegeId: data.collegeId,
    })

    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "You've already contacted this college today. Please wait 24 hours." },
        { status: 429 }
      )
    }

    const [enquiry] = await db
      .insert(enquiries)
      .values({
        studentId: session?.user.role === 'student' ? session.user.id : null,
        collegeId: data.collegeId,
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        message: data.message,
      })
      .returning({ id: enquiries.id })

    const counsellorEmail = college.counsellorEmail || college.ownerEmail
    const appUrl =
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inboxUrl = new URL('/college/enquiries', appUrl).toString()
    const safeCollegeName = escapeHtml(college.name)
    const safeName = escapeHtml(data.name)
    const safeEmail = escapeHtml(data.email)
    const safePhone = escapeHtml(data.phone || 'Not provided')
    const safeMessage = formatMultilineHtml(data.message)
    const emailJobs: Array<Promise<unknown>> = []

    if (counsellorEmail) {
      emailJobs.push(
        sendMail({
          to: counsellorEmail,
          subject: `New Enquiry from ${data.name} - UniBridge`,
          html: `<p>Hello,</p><p>You have received a new enquiry for <strong>${safeCollegeName}</strong>.</p><p><strong>Name:</strong> ${safeName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Phone:</strong> ${safePhone}</p><p><strong>Message:</strong></p><p>${safeMessage}</p><p>Review all enquiries in your college inbox: <a href="${escapeHtml(inboxUrl)}">${escapeHtml(inboxUrl)}</a></p><br/>Best,<br/>UniBridge Team`,
        })
      )
    }

    emailJobs.push(
      sendMail({
        to: data.email,
        subject: `Your enquiry to ${college.name} has been received`,
        html: `<p>Hello ${safeName},</p><p>We've forwarded your message to the admissions team at <strong>${safeCollegeName}</strong>.</p><p>They'll get back to you at <strong>${safeEmail}</strong>.</p><p>Your message:</p><p>${safeMessage}</p><br/>Best,<br/>UniBridge Team`,
      })
    )

    const emailResults = await Promise.allSettled(emailJobs)
    emailResults.forEach((result) => {
      if (result.status === 'rejected') {
        console.error('Failed to send enquiry email:', result.reason)
      }
    })

    return NextResponse.json({ success: true, enquiryId: enquiry.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Invalid enquiry data.' },
        { status: 400 }
      )
    }

    console.error('Enquiry submission error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
