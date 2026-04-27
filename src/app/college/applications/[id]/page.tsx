import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import ApplicationStatusBadge, { formatApplicationStatus } from '@/components/ApplicationStatusBadge'
import { getCollegeApplicationDetail, getCollegeRecordForUser } from '@/lib/college-applications'
import { requireAuth } from '@/lib/session'
import ApplicationStatusPanel from './ApplicationStatusPanel'

function formatDateTime(value: Date | string | null) {
  if (!value) {
    return 'Not available'
  }

  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatValue(value: string | number | null, suffix = '') {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }

  return `${value}${suffix}`
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-md-on-surface-variant">{label}</p>
      <p className="mt-1 text-md-on-surface">{value}</p>
    </div>
  )
}

export default async function CollegeApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth(['college'])
  const college = await getCollegeRecordForUser(user.id)

  if (!college) {
    notFound()
  }

  const { id } = await params
  const detail = await getCollegeApplicationDetail({
    collegeId: college.id,
    applicationId: id,
  })

  if (!detail) {
    notFound()
  }

  const { application, history } = detail

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 animate-page-enter">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-md-primary">
            Applicant Review
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            {application.studentName}
          </h1>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            Applied to {application.collegeName} for{' '}
            {application.courseName
              ? application.courseDegree
                ? `${application.courseName} (${application.courseDegree})`
                : application.courseName
              : 'an unspecified course'}
          </p>
        </div>

        <Link
          href="/college/applications"
          className="inline-flex h-10 items-center justify-center rounded-full border border-md-outline px-6 text-sm font-medium text-md-primary transition-colors hover:bg-md-primary/5"
        >
          Back to Applicants
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <div className="space-y-6">
          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Personal Information</CardTitle>
              <CardDescription>Core applicant details shared during application.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <InfoItem label="Student name" value={application.studentName} />
              <InfoItem label="Email" value={application.studentEmail} />
              <InfoItem label="Phone" value={application.phone || 'N/A'} />
              <InfoItem label="Date of birth" value={application.dob || 'N/A'} />
              <InfoItem label="Gender" value={application.gender || 'N/A'} />
              <InfoItem label="Category" value={(application.category || 'N/A').toUpperCase()} />
              <InfoItem label="Address" value={application.address || 'N/A'} className="md:col-span-2" />
              <InfoItem
                label="City, state"
                value={[application.city, application.state].filter(Boolean).join(', ') || 'N/A'}
              />
              <InfoItem label="Pincode" value={application.pincode || 'N/A'} />
            </CardContent>
          </Card>

          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Academic Details</CardTitle>
              <CardDescription>Marks, entrance details, and selected course.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <InfoItem label="10th percentage" value={formatValue(application.tenthPercent, '%')} />
              <InfoItem label="12th percentage" value={formatValue(application.twelfthPercent, '%')} />
              <InfoItem label="Entrance exam" value={application.entranceExam || 'N/A'} />
              <InfoItem label="Entrance score" value={formatValue(application.entranceScore)} />
              <InfoItem
                label="Course applied"
                value={
                  application.courseName
                    ? application.courseDegree
                      ? `${application.courseName} (${application.courseDegree})`
                      : application.courseName
                    : 'Course not selected'
                }
                className="md:col-span-2"
              />
              <InfoItem
                label="Applicant notes"
                value={application.notes || 'No additional notes shared.'}
                className="md:col-span-2"
              />
            </CardContent>
          </Card>

          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Status Timeline</CardTitle>
              <CardDescription>Every application update recorded so far.</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="rounded-2xl bg-md-surface p-5 text-sm text-md-on-surface-variant">
                  No status history is available yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex gap-4">
                      <div className="mt-2 h-3 w-3 rounded-full bg-md-primary" />
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <ApplicationStatusBadge status={entry.status} />
                          <span className="text-xs uppercase tracking-[0.2em] text-md-on-surface-variant">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-md-on-surface-variant">
                          Updated by {entry.changedByName || 'System'} ({entry.changedByRole || 'system'})
                        </p>
                        {entry.note && (
                          <p className="rounded-2xl bg-md-surface px-4 py-3 text-sm text-md-on-surface">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Current Decision</CardTitle>
              <CardDescription>Submitted on {formatDateTime(application.submittedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-md-surface px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-md-on-surface-variant">
                  Current status
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <ApplicationStatusBadge status={application.status} />
                  <span className="text-sm text-md-on-surface-variant">
                    {formatApplicationStatus(application.status)}
                  </span>
                </div>
              </div>

              <ApplicationStatusPanel applicationId={application.id} currentStatus={application.status} />
            </CardContent>
          </Card>

          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Quick Facts</CardTitle>
              <CardDescription>Useful metadata for follow-up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-md-on-surface-variant">
              <div>
                <p className="font-medium text-md-on-surface">Application ID</p>
                <p className="font-mono">{application.id}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Last updated</p>
                <p>{formatDateTime(application.updatedAt)}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Student email</p>
                <p>{application.studentEmail}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
