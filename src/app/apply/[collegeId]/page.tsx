import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { applications, colleges, courses, users } from '@/db/schema'
import ApplicationForm from './ApplicationForm'

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ collegeId: string }>
}) {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/login')
  }

  if (session.user.role !== 'student') {
    redirect('/dashboard')
  }

  const { collegeId } = await params

  const [collegeData, studentData, existingApplication] = await Promise.all([
    db
      .select({ name: colleges.name, id: colleges.id, slug: colleges.slug })
      .from(colleges)
      .where(
        and(
          eq(colleges.id, collegeId),
          eq(colleges.verificationStatus, 'approved')
        )
      )
      .limit(1),
    db
      .select({ phone: users.phone })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
    db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.studentId, session.user.id),
          eq(applications.collegeId, collegeId)
        )
      )
      .limit(1),
  ])

  if (collegeData.length === 0) {
    notFound()
  }

  const college = collegeData[0]

  const collegeCourses = await db
    .select({ id: courses.id, name: courses.name, degree: courses.degree })
    .from(courses)
    .where(eq(courses.collegeId, collegeId))

  if (existingApplication.length > 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 animate-page-enter">
        <div className="rounded-3xl border border-md-outline/10 bg-md-surface p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-md-primary">
            Application Already Submitted
          </p>
          <h1 className="mt-3 text-3xl font-medium text-md-on-surface">
            You have already applied to {college.name}
          </h1>
          <p className="mt-3 text-md-on-surface-variant">
            You can track the current status from your applications dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/applications/${existingApplication[0].id}`}
              className="inline-flex items-center justify-center rounded-full bg-md-primary px-6 py-2.5 text-sm font-medium text-md-on-primary transition-colors hover:bg-md-primary/90"
            >
              View Application
            </Link>
            <Link
              href="/dashboard/applications"
              className="inline-flex items-center justify-center rounded-full border border-md-outline/20 bg-transparent px-6 py-2.5 text-sm font-medium text-md-primary transition-colors hover:bg-md-primary/10"
            >
              All Applications
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (collegeCourses.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 animate-page-enter">
        <div className="rounded-3xl border border-md-outline/10 bg-md-surface p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-yellow-600">
            Applications Not Open
          </p>
          <h1 className="mt-3 text-3xl font-medium text-md-on-surface">
            {college.name} has not published courses yet
          </h1>
          <p className="mt-3 text-md-on-surface-variant">
            The application form needs at least one published course before a
            submission can be created.
          </p>
          <div className="mt-6">
            <Link
              href={`/colleges/${college.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-md-outline/20 bg-transparent px-6 py-2.5 text-sm font-medium text-md-primary transition-colors hover:bg-md-primary/10"
            >
              ← Back to College
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-page-enter">
      <h1 className="mb-8 text-3xl font-medium text-md-on-surface text-center">
        Application for {college.name}
      </h1>
      <ApplicationForm
        collegeId={college.id}
        collegeName={college.name}
        courses={collegeCourses}
        student={{
          name: session.user.name || '',
          email: session.user.email || '',
          phone: studentData[0]?.phone || '',
        }}
      />
    </div>
  )
}
