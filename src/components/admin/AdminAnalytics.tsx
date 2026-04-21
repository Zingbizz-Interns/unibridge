import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export type AdminBarPoint = {
  label: string
  value: number
}

export type AdminGrowthPoint = {
  label: string
  students: number
  colleges: number
}

export type AdminTopCollege = {
  id: string
  name: string
  city: string
  views: number
  applications: number
  acceptanceRate: number
}

export function formatMetricNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function OverviewStatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-4xl">{value}</CardTitle>
        {helper && <CardDescription>{helper}</CardDescription>}
      </CardHeader>
    </Card>
  )
}

export function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-md-on-surface">{title}</h1>
      <p className="mt-2 text-sm text-md-on-surface-variant">{description}</p>
    </div>
  )
}

export function HorizontalBarChart({
  title,
  description,
  data,
  accentClassName,
}: {
  title: string
  description: string
  data: AdminBarPoint[]
  accentClassName?: string
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)

  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
            No data available yet.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-md-on-surface">{item.label}</span>
                  <span className="text-md-on-surface-variant">{formatMetricNumber(item.value)}</span>
                </div>
                <div className="h-3 rounded-full bg-md-surface">
                  <div
                    className={cn(
                      'h-3 rounded-full bg-md-primary',
                      accentClassName
                    )}
                    style={{ width: `${Math.max((item.value / maxValue) * 100, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function buildLinePath(data: AdminBarPoint[], width: number, height: number) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)

  return data
    .map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width
      const y = height - (item.value / maxValue) * (height - 20) - 10
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export function LineChartCard({
  title,
  description,
  data,
}: {
  title: string
  description: string
  data: AdminBarPoint[]
}) {
  const width = 640
  const height = 220
  const linePath = data.length > 0 ? buildLinePath(data, width, height) : ''

  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
            No data available yet.
          </div>
        ) : (
          <div className="space-y-4">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
              <path
                d={linePath}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-md-primary"
              />
            </svg>
            <div className="grid grid-cols-2 gap-3 text-xs text-md-on-surface-variant sm:grid-cols-4 lg:grid-cols-6">
              {data.map((item) => (
                <div key={item.label} className="rounded-2xl bg-md-surface p-3 text-center">
                  <div className="font-semibold text-md-on-surface">
                    {formatMetricNumber(item.value)}
                  </div>
                  <div>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StackedGrowthChart({
  title,
  description,
  data,
}: {
  title: string
  description: string
  data: AdminGrowthPoint[]
}) {
  const maxValue = Math.max(
    ...data.map((item) => item.students + item.colleges),
    1
  )

  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
            No data available yet.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 text-sm text-md-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-md-primary" />
                <span>Students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-md-tertiary" />
                <span>Colleges</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {data.map((item) => {
                const total = item.students + item.colleges
                const studentsHeight = `${(item.students / maxValue) * 100}%`
                const collegesHeight = `${(item.colleges / maxValue) * 100}%`

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl bg-md-surface p-4 text-center"
                  >
                    <div className="mx-auto flex h-40 w-14 items-end justify-center gap-0 overflow-hidden rounded-3xl bg-md-surface-container-low p-2">
                      <div className="flex h-full w-full flex-col justify-end gap-[2px]">
                        <div
                          className="rounded-t-2xl bg-md-primary"
                          style={{ height: studentsHeight }}
                        />
                        <div
                          className="rounded-b-2xl bg-md-tertiary"
                          style={{ height: collegesHeight }}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold text-md-on-surface">
                      {formatMetricNumber(total)}
                    </div>
                    <div className="text-xs text-md-on-surface-variant">{item.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TopCollegesTable({
  title,
  description,
  colleges,
}: {
  title: string
  description: string
  colleges: AdminTopCollege[]
}) {
  return (
    <Card elevation="elevated">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {colleges.length === 0 ? (
          <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
            No college engagement data yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-md-outline/10">
            <table className="min-w-full text-left">
              <thead className="bg-md-surface">
                <tr className="text-sm text-md-on-surface-variant">
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">College</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Views</th>
                  <th className="px-4 py-3 font-medium">Applications</th>
                  <th className="px-4 py-3 font-medium">Acceptance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-md-outline/10 bg-md-surface-container-low">
                {colleges.map((college, index) => (
                  <tr key={college.id}>
                    <td className="px-4 py-4 text-sm font-medium text-md-on-surface">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-md-on-surface">{college.name}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                      {college.city}
                    </td>
                    <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                      {formatMetricNumber(college.views)}
                    </td>
                    <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                      {formatMetricNumber(college.applications)}
                    </td>
                    <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                      {formatPercent(college.acceptanceRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
