import Link from 'next/link'
import {
  HorizontalBarChart,
  LineChartCard,
  OverviewStatCard,
  SectionHeading,
  StackedGrowthChart,
  TopCollegesTable,
  formatMetricNumber,
  formatPercent,
} from '@/components/admin/AdminAnalytics'
import { Button } from '@/components/ui/Button'
import {
  getAdminOverviewStats,
  getApplicationsOverTime,
  getTopColleges,
  getTrendingStats,
  getUserGrowth,
} from '@/lib/admin-dashboard'

type AnalyticsPageSearchParams = Promise<{
  period?: string
}>

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: AnalyticsPageSearchParams
}) {
  const resolvedSearchParams = await searchParams
  const period =
    resolvedSearchParams.period === '7d' || resolvedSearchParams.period === '90d'
      ? resolvedSearchParams.period
      : '30d'

  const [overview, trending, applicationsOverTime, topColleges, userGrowth] = await Promise.all([
    getAdminOverviewStats(),
    getTrendingStats(),
    getApplicationsOverTime(period),
    getTopColleges(),
    getUserGrowth(),
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          title="Platform Analytics"
          description="Track where demand is coming from, how application volume is moving, and which colleges are getting the most attention."
        />
        <div className="flex flex-wrap gap-3">
          {(['7d', '30d', '90d'] as const).map((value) => (
            <Button
              key={value}
              asChild
              variant={value === period ? 'default' : 'outline'}
              size="sm"
            >
              <Link href={`/admin/analytics?period=${value}`}>{value}</Link>
            </Button>
          ))}
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
        />
        <OverviewStatCard
          label="Enquiries"
          value={formatMetricNumber(overview.totalEnquiries)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <HorizontalBarChart
          title="Trending Cities"
          description="Top cities by application volume."
          data={trending.cities}
        />
        <HorizontalBarChart
          title="Trending Courses"
          description="Courses drawing the most student applications."
          data={trending.courses}
          accentClassName="bg-md-tertiary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <LineChartCard
          title="Application Volume"
          description={`Daily applications over the last ${period}.`}
          data={applicationsOverTime}
        />
        <StackedGrowthChart
          title="User Growth"
          description="Weekly student and college registrations over the last 90 days."
          data={userGrowth}
        />
      </div>

      <TopCollegesTable
        title="Most Viewed and Most Applied Colleges"
        description="A ranked look at the colleges getting the strongest engagement."
        colleges={topColleges}
      />
    </div>
  )
}
