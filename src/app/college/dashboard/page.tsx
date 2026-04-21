import Link from 'next/link'
import { and, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import ApplicationStatusBadge, { formatApplicationStatus } from '@/components/ApplicationStatusBadge'
import { colleges, documents } from '@/db/schema'
import { getCollegeApplicationOverview } from '@/lib/college-applications'
import { db } from '@/lib/db'
import { needsCollegeOnboarding } from '@/lib/college-onboarding'
import { requireAuth } from '@/lib/session'
import { storageBuckets } from '@/lib/storage'

function formatDate(value: Date | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function Sparkline({ points }: { points: Array<{ label: string; value: number }> }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1)
  const width = 180
  const height = 60
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width
      const y = height - (point.value / maxValue) * (height - 8) - 4
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full" aria-label="Applications received over the last seven days">
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-md-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="grid grid-cols-7 gap-2 text-[11px] text-md-on-surface-variant">
        {points.map((point) => (
          <div key={point.label} className="text-center">
            <div className="font-medium">{point.value}</div>
            <div>{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default async function CollegeDashboardPage() {
  const user = await requireAuth(['college'])

  const [college] = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      category: colleges.category,
      collegeType: colleges.collegeType,
      type: colleges.type,
      city: colleges.city,
      state: colleges.state,
      pincode: colleges.pincode,
      affiliation: colleges.affiliation,
      website: colleges.website,
      description: colleges.description,
      counsellorEmail: colleges.counsellorEmail,
      counsellorPhone: colleges.counsellorPhone,
      verificationStatus: colleges.verificationStatus,
      latitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_Y(${colleges.location}) END`,
      longitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_X(${colleges.location}) END`,
    })
    .from(colleges)
    .where(eq(colleges.userId, user.id))
    .limit(1)

  const collegeDocuments = college
    ? await db
        .select({ type: documents.type })
        .from(documents)
        .where(
          and(
            eq(documents.collegeId, college.id),
            eq(documents.storageBucket, storageBuckets.verification)
          )
        )
    : []

  if (college && needsCollegeOnboarding(college, collegeDocuments.map((doc) => doc.type))) {
    redirect('/college/onboarding')
  }

  if (!college) {
    redirect('/college/onboarding')
  }

  const overview = await getCollegeApplicationOverview(college.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-md-primary">College Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">{college.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-md-on-surface-variant">
            Review new applicants, track admissions activity, and keep your team aligned on the next decision.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/college/courses">Manage Courses</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/settings">Edit Profile</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/enquiries">View Enquiries</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/placements/drives">Placement Tracker</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/documents">Document Vault</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/college/applications/export">Export CSV</a>
          </Button>
          <Button asChild>
            <Link href="/college/applications">View Applicants</Link>
          </Button>
        </div>
      </div>

      {college.verificationStatus !== 'approved' && (
        <Card elevation="elevated" className="mb-8 border border-md-outline/20 bg-md-secondary-container/50">
          <CardHeader>
            <CardTitle className="text-xl">
              Verification Status: {formatApplicationStatus(college.verificationStatus)}
            </CardTitle>
            <CardDescription>
              Applicant management is available now, but new students can only apply once your college profile is approved and visible publicly.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total applications received" value={overview.stats.total} />
        <StatCard label="Pending review" value={overview.stats.pendingReview} />
        <StatCard label="Shortlisted" value={overview.stats.shortlisted} />
        <StatCard label="Accepted" value={overview.stats.accepted} />
        <StatCard label="Rejected" value={overview.stats.rejected} />
        <Card elevation="elevated">
          <CardHeader>
            <CardDescription>Applications this week</CardDescription>
            <CardTitle className="text-4xl">{overview.stats.thisWeek}</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline points={overview.stats.sparkline} />
          </CardContent>
        </Card>
      </div>

      <Card elevation="elevated" className="mt-8">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">Recent Applications</CardTitle>
            <CardDescription>The last 10 students who applied to your college.</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/college/applications">Open full applicant list</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {overview.recentApplications.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No applications have been received yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-md-outline/15">
              <table className="min-w-full text-left">
                <thead className="bg-md-surface">
                  <tr className="text-sm text-md-on-surface-variant">
                    <th className="px-4 py-3 font-medium">Student Name</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Applied On</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-md-outline/10 bg-md-surface-container-low">
                  {overview.recentApplications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-4 py-4 font-medium text-md-on-surface">{application.studentName}</td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {application.courseName
                          ? application.courseDegree
                            ? `${application.courseName} (${application.courseDegree})`
                            : application.courseName
                          : 'Course not selected'}
                      </td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {formatDate(application.submittedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <ApplicationStatusBadge status={application.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/college/applications/${application.id}`} className="text-sm font-medium text-md-primary hover:underline">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
