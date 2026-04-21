import Link from 'next/link'
import {
  OverviewStatCard,
  SectionHeading,
  TopCollegesTable,
  formatMetricNumber,
  formatPercent,
} from '@/components/admin/AdminAnalytics'
import { AdminCollegeStatusBadge } from '@/components/admin/AdminCollegeStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  getAdminCollegeList,
  getAdminOverviewStats,
  getTopColleges,
} from '@/lib/admin-dashboard'

function formatDate(value: Date | null) {
  if (!value) {
    return 'Unknown'
  }

  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminDashboardPage() {
  const [overview, topColleges, pendingQueue] = await Promise.all([
    getAdminOverviewStats(),
    getTopColleges(),
    getAdminCollegeList({
      status: 'pending',
      page: 1,
      pageSize: 5,
    }),
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          title="Platform Overview"
          description="Monitor platform growth, review verification work, and keep an eye on the colleges driving the most student demand."
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/verifications">Open Verification Queue</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/analytics">View Analytics</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <OverviewStatCard
          label="Total Students"
          value={formatMetricNumber(overview.totalStudents)}
        />
        <OverviewStatCard
          label="Approved Colleges"
          value={formatMetricNumber(overview.totalColleges)}
        />
        <OverviewStatCard
          label="Applications"
          value={formatMetricNumber(overview.totalApplications)}
        />
        <OverviewStatCard
          label="Acceptance Rate"
          value={formatPercent(overview.acceptanceRate)}
          helper={`${formatMetricNumber(overview.totalAccepted)} accepted`}
        />
        <OverviewStatCard
          label="Enquiries"
          value={formatMetricNumber(overview.totalEnquiries)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <TopCollegesTable
          title="Top Colleges"
          description="Most-applied colleges based on current platform activity."
          colleges={topColleges.slice(0, 5)}
        />

        <Card elevation="elevated">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">Pending Verification Queue</CardTitle>
              <CardDescription>
                Colleges waiting for admin review right now.
              </CardDescription>
            </div>
            <AdminCollegeStatusBadge status="pending" />
          </CardHeader>
          <CardContent>
            {pendingQueue.colleges.length === 0 ? (
              <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
                No colleges are waiting for review.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingQueue.colleges.map((college) => (
                  <div
                    key={college.id}
                    className="rounded-3xl border border-md-outline/10 bg-md-surface p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-md-on-surface">{college.name}</p>
                        <p className="text-sm text-md-on-surface-variant">
                          {[college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable'}
                        </p>
                        <p className="mt-1 text-xs text-md-on-surface-variant">
                          Submitted {formatDate(college.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-md-on-surface-variant">
                          {college.documents.length} docs
                        </span>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/admin/verifications">Review</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button asChild variant="tonal" className="w-full">
                  <Link href="/admin/verifications">Open Full Queue</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
