import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import ApplicationStatusBadge, { formatApplicationStatus } from '@/components/ApplicationStatusBadge'
import { db } from '@/lib/db'
import { applications, colleges, courses } from '@/db/schema'
import { getApplicationHistory } from '@/lib/college-applications'
import WithdrawButton from './WithdrawButton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const statusDescriptions: Record<string, string> = {
  submitted:
    'Your application has been submitted successfully and is waiting for review.',
  under_review:
    'The college has opened your application and is reviewing your details.',
  shortlisted:
    'You are shortlisted for the next stage of the admission process.',
  accepted: 'Congratulations. The college has accepted your application.',
  rejected:
    'The college has decided not to move forward with this application.',
  withdrawn:
    'You withdrew this application before the college finished processing it.',
}

function formatDateTime(value: Date | string | null) {
  if (!value) {
    return 'Not available'
  }

  const parsed = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available'
  }

  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function normalizeWebsite(website: string | null) {
  if (!website) {
    return null
  }

  try {
    return new URL(website.startsWith('http') ? website : `https://${website}`)
  } catch {
    return null
  }
}

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-sm font-medium text-md-on-surface-variant">{label}</p>
      <p className="text-md-on-surface mt-0.5">{value || 'N/A'}</p>
    </div>
  )
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  const { id } = await params

  const appData = await db
    .select({
      application: applications,
      college: {
        name: colleges.name,
        slug: colleges.slug,
        city: colleges.city,
        state: colleges.state,
        counsellorEmail: colleges.counsellorEmail,
        counsellorPhone: colleges.counsellorPhone,
        website: colleges.website,
      },
      course: {
        name: courses.name,
        degree: courses.degree,
      },
    })
    .from(applications)
    .innerJoin(colleges, eq(applications.collegeId, colleges.id))
    .leftJoin(courses, eq(applications.courseId, courses.id))
    .where(eq(applications.id, id))
    .limit(1)

  if (appData.length === 0) {
    notFound()
  }

  const { application, college, course } = appData[0]

  if (application.studentId !== session.user.id) {
    redirect('/dashboard/applications')
  }

  const canWithdraw =
    application.status === 'submitted' || application.status === 'under_review'
  const website = normalizeWebsite(college.website)
  const history = await getApplicationHistory(application.id)
  const timeline = history.length > 0
    ? history.map((entry) => ({
        id: entry.id,
        title: formatApplicationStatus(entry.status),
        description:
          entry.note ||
          statusDescriptions[entry.status || 'submitted'] ||
          'The college has updated your application.',
        timestamp: entry.createdAt,
      }))
    : [
        application.submittedAt
          ? {
              id: 'submitted',
              title: 'Application Submitted',
              description:
                'Your application was sent to the college and is visible in your dashboard.',
              timestamp: application.submittedAt,
            }
          : null,
        application.status !== 'submitted' && application.updatedAt
          ? {
              id: 'latest',
              title: `Status updated to ${formatApplicationStatus(application.status)}`,
              description:
                statusDescriptions[application.status || 'submitted'] ||
                'The college has updated your application.',
              timestamp: application.updatedAt,
            }
          : null,
      ].filter(Boolean) as Array<{
        id: string
        title: string
        description: string
        timestamp: Date | string | null
      }>

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-medium text-md-on-surface">
          Application Details
        </h1>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/applications">&larr; Back to Applications</Link>
        </Button>
      </div>

      {/* Main application card */}
      <Card elevation="elevated" className="mb-8 overflow-hidden">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-md-outline/10 p-6 gap-4">
          <div>
            <h2 className="mb-1 text-xl font-medium text-md-on-surface">
              <Link
                href={`/colleges/${college.slug}`}
                className="hover:text-md-primary transition-colors"
              >
                {college.name}
              </Link>
            </h2>
            <p className="text-md-on-surface-variant">
              {college.city}, {college.state}
            </p>
            {course ? (
              <p className="mt-2 font-medium text-md-on-surface">
                Applied for: {course.name}{' '}
                {course.degree ? `(${course.degree})` : ''}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-md-on-surface-variant">
              Application ID: <span className="font-mono">{application.id}</span>
            </p>
            <p className="mt-1 text-sm text-md-on-surface-variant">
              Submitted on {formatDateTime(application.submittedAt)}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <ApplicationStatusBadge status={application.status} className="px-3 py-1.5 text-sm" />
            {canWithdraw ? <WithdrawButton applicationId={application.id} /> : null}
          </div>
        </div>

        {/* Submitted information */}
        <CardContent className="pt-6">
          <h3 className="mb-4 border-b border-md-outline/10 pb-2 text-lg font-medium text-md-on-surface">
            Submitted Information
          </h3>

          <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
            <InfoField label="Applicant Name" value={session.user.name} />
            <InfoField label="Applicant Email" value={session.user.email} />
            <InfoField label="Phone" value={application.phone} />
            <InfoField label="Date of Birth" value={application.dob} />
            <InfoField label="Gender" value={application.gender ? application.gender.charAt(0).toUpperCase() + application.gender.slice(1) : null} />
            <InfoField label="Category" value={application.category?.toUpperCase()} />
            <div className="md:col-span-2">
              <InfoField label="Address" value={application.address} />
            </div>
            <InfoField label="City, State" value={`${application.city || 'N/A'}, ${application.state || 'N/A'}`} />
            <InfoField label="Pincode" value={application.pincode} />

            {/* Academic section */}
            <div className="md:col-span-2 mt-2 border-t border-md-outline/10 pt-4">
              <h4 className="mb-4 font-medium text-md-on-surface">
                Academic Details
              </h4>
            </div>

            <InfoField label="10th Percentage" value={application.tenthPercent ? `${application.tenthPercent}%` : null} />
            <InfoField label="12th Percentage" value={application.twelfthPercent ? `${application.twelfthPercent}%` : null} />
            <InfoField label="Entrance Exam" value={application.entranceExam} />
            <InfoField label="Entrance Score" value={application.entranceScore} />

            {/* College contact section */}
            <div className="md:col-span-2 mt-2 border-t border-md-outline/10 pt-4">
              <h4 className="mb-4 font-medium text-md-on-surface">
                College Contact
              </h4>
            </div>

            <InfoField label="Counsellor Email" value={college.counsellorEmail} />
            <InfoField label="Counsellor Phone" value={college.counsellorPhone} />
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-md-on-surface-variant">Website</p>
              {website ? (
                <a
                  href={website.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-md-primary hover:text-md-primary/80 transition-colors mt-0.5 inline-block"
                >
                  {website.href}
                </a>
              ) : (
                <p className="text-md-on-surface mt-0.5">N/A</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline card */}
      <Card elevation="elevated" className="p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl">Status Timeline</CardTitle>
          <CardDescription>
            This view reflects the latest status updates available on your application.
          </CardDescription>
        </CardHeader>

        <div className="space-y-4">
          {timeline.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="mt-1.5 h-3 w-3 rounded-full bg-md-primary shrink-0" />
              <div>
                <p className="font-medium text-md-on-surface">{item.title}</p>
                <p className="text-sm text-md-on-surface-variant">{item.description}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-md-on-surface-variant/60">
                  {formatDateTime(item.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {timeline.length === 0 ? (
            <p className="text-sm text-md-on-surface-variant">
              Status updates will appear here once the college starts reviewing
              the application.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
