import Link from 'next/link'
import { AdminCollegeActions } from '@/components/admin/AdminCollegeActions'
import { AdminCollegeStatusBadge } from '@/components/admin/AdminCollegeStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  adminCollegeStatuses,
  getAdminCollegeList,
  getAdminCollegeStatusFilter,
  parsePositivePage,
} from '@/lib/admin-dashboard'

type CollegesPageSearchParams = Promise<{
  status?: string
  search?: string
  page?: string
}>

function buildPageHref(page: number, status: string, search: string) {
  const params = new URLSearchParams()
  params.set('page', String(page))

  if (status && status !== 'all') {
    params.set('status', status)
  }

  if (search.trim()) {
    params.set('search', search.trim())
  }

  return `/admin/colleges?${params.toString()}`
}

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

export default async function AdminCollegesPage({
  searchParams,
}: {
  searchParams: CollegesPageSearchParams
}) {
  const resolvedSearchParams = await searchParams
  const status = getAdminCollegeStatusFilter(resolvedSearchParams.status)
  const search = resolvedSearchParams.search?.trim() || ''
  const page = parsePositivePage(resolvedSearchParams.page)
  const limit = 20

  const result = await getAdminCollegeList({
    status,
    search,
    page,
    pageSize: limit,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / limit))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-md-on-surface">College Management</h1>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            Search all colleges, review their current verification state, and take moderation actions when needed.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/verifications">Jump to Verification Queue</Link>
        </Button>
      </div>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Filters</CardTitle>
          <CardDescription>Narrow the list by status or college name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,auto]" method="GET">
            <Input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search college name"
            />
            <Button type="submit">Apply</Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {adminCollegeStatuses.map((value) => (
              <Button
                key={value}
                asChild
                variant={value === status ? 'default' : 'outline'}
                size="sm"
              >
                <Link
                  href={
                    search
                      ? `/admin/colleges?status=${value}&search=${encodeURIComponent(search)}`
                      : `/admin/colleges?status=${value}`
                  }
                  className="capitalize"
                >
                  {value}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5">
        {result.colleges.length === 0 ? (
          <Card elevation="elevated">
            <CardContent className="py-12 text-center text-sm text-md-on-surface-variant">
              No colleges matched the current filters.
            </CardContent>
          </Card>
        ) : (
          result.colleges.map((college) => (
            <Card key={college.id} elevation="elevated">
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-2xl">{college.name}</CardTitle>
                    <AdminCollegeStatusBadge status={college.verificationStatus} />
                  </div>
                  <CardDescription>
                    {[college.city, college.state].filter(Boolean).join(', ') || 'Location unavailable'}
                  </CardDescription>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-md-on-surface-variant">
                    <span>Owner: {college.ownerEmail}</span>
                    <span>Applications: {college.applications}</span>
                    <span>Views: {college.views}</span>
                    <span>Documents: {college.documents.length}</span>
                    <span>Created: {formatDate(college.createdAt)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button asChild variant="tonal" size="sm">
                    <Link href={`/admin/colleges/${college.id}`}>View Details</Link>
                  </Button>
                  <AdminCollegeActions
                    collegeId={college.id}
                    status={college.verificationStatus}
                    compact
                  />
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {result.total > limit && (
        <div className="flex items-center justify-between rounded-3xl border border-md-outline/10 bg-md-surface-container px-5 py-4">
          <Button asChild variant="outline" disabled={page <= 1}>
            <Link href={buildPageHref(Math.max(1, page - 1), status, search)}>
              Previous
            </Link>
          </Button>
          <p className="text-sm text-md-on-surface-variant">
            Page {page} of {totalPages}
          </p>
          <Button asChild variant="outline" disabled={page >= totalPages}>
            <Link href={buildPageHref(Math.min(totalPages, page + 1), status, search)}>
              Next
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
