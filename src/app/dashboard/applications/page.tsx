import Link from 'next/link'
import { redirect } from 'next/navigation'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import ApplicationStatusBadge from '@/components/ApplicationStatusBadge'
import { db } from '@/lib/db'
import { applications, colleges, courses } from '@/db/schema'
import ApplicationsRefreshOnFocus from './ApplicationsRefreshOnFocus'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const statusFilters = [
  'all',
  'submitted',
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
] as const

type StatusFilter = (typeof statusFilters)[number]

function getFilterHref(status: StatusFilter) {
  return status === 'all'
    ? '/dashboard/applications'
    : `/dashboard/applications?status=${status}`
}

function getFilterLabel(status: StatusFilter) {
  return status === 'all'
    ? 'All'
    : status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()

  if (!session || session.user.role !== 'student') {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const requestedStatus =
    typeof resolvedSearchParams.status === 'string'
      ? resolvedSearchParams.status
      : 'all'
  const activeStatus = statusFilters.includes(requestedStatus as StatusFilter)
    ? (requestedStatus as StatusFilter)
    : 'all'
  const selectedStatus = activeStatus === 'all' ? null : activeStatus

  const userApplications = await db
    .select({
      id: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      collegeName: colleges.name,
      collegeSlug: colleges.slug,
      courseName: courses.name,
    })
    .from(applications)
    .innerJoin(colleges, eq(applications.collegeId, colleges.id))
    .leftJoin(courses, eq(applications.courseId, courses.id))
    .where(
      selectedStatus
        ? and(
            eq(applications.studentId, session.user.id),
            eq(applications.status, selectedStatus)
          )
        : eq(applications.studentId, session.user.id)
    )
    .orderBy(desc(applications.submittedAt))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ApplicationsRefreshOnFocus />

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-medium text-md-on-surface">My Applications</h1>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">&larr; Back to Dashboard</Link>
        </Button>
      </div>

      {/* Filter chips */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-sm font-medium text-md-on-surface-variant">
            Filter by status:
          </span>
          {statusFilters.map((status) => {
            const isActive = status === activeStatus

            return (
              <Link
                key={status}
                href={getFilterHref(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 active:scale-95 ${
                  isActive
                    ? 'bg-md-primary text-md-on-primary shadow-sm'
                    : 'bg-md-surface text-md-on-surface-variant hover:bg-md-primary/10 hover:text-md-primary'
                }`}
              >
                {getFilterLabel(status)}
              </Link>
            )
          })}
        </div>
      </Card>

      {userApplications.length === 0 ? (
        <Card className="p-8 text-center" elevation="elevated">
          <p className="mb-4 text-md-on-surface-variant">
            {selectedStatus
              ? `No applications are currently marked as ${getFilterLabel(activeStatus)}.`
              : "You haven't submitted any applications yet."}
          </p>
          <Button asChild>
            <Link href="/colleges">
              {selectedStatus ? 'Explore More Colleges' : 'Explore Colleges'}
            </Link>
          </Button>
        </Card>
      ) : (
        <Card elevation="elevated" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-md-outline/10 bg-md-surface text-sm text-md-on-surface-variant">
                  <th className="px-6 py-4 font-medium">College</th>
                  <th className="px-6 py-4 font-medium">Course</th>
                  <th className="px-6 py-4 font-medium">Applied On</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/10">
                {userApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="transition-colors duration-200 hover:bg-md-primary/5"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/colleges/${application.collegeSlug}`}
                        className="font-medium text-md-primary hover:text-md-primary/80 transition-colors"
                      >
                        {application.collegeName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-md-on-surface-variant">
                      {application.courseName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-md-on-surface-variant">
                      {application.submittedAt
                        ? new Date(application.submittedAt).toLocaleDateString(
                            'en-IN',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }
                          )
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <ApplicationStatusBadge status={application.status || 'submitted'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/applications/${application.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
