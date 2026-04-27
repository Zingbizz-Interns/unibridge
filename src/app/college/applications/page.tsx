import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  collegeApplicantCategories,
  collegeApplicantSortOptions,
  collegeApplicantStatuses,
  getCollegeApplicantCategoryFilter,
  getCollegeApplicantSort,
  getCollegeApplicantStatusFilter,
  getCollegeApplicationsList,
  getCollegeRecordForUser,
  parsePositivePage,
} from '@/lib/college-applications'
import { requireAuth } from '@/lib/session'
import ApplicantsTableClient from './ApplicantsTableClient'

function formatStatusFilter(status?: string | null) {
  if (!status) return 'All statuses'
  return status === 'all'
    ? 'All statuses'
    : String(status).replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCategoryFilter(category?: string | null) {
  if (!category) return 'All categories'
  return category === 'all' ? 'All categories' : String(category).toUpperCase()
}

function formatSortOption(sort?: string | null) {
  if (!sort) return 'Applied date: Newest first'
  switch (sort) {
    case 'submitted_asc':
      return 'Applied date: Oldest first'
    case 'twelfth_desc':
      return '12th percentage: Highest first'
    case 'entrance_desc':
      return 'Entrance score: Highest first'
    case 'submitted_desc':
    default:
      return 'Applied date: Newest first'
  }
}

function getPageHref({
  status,
  course,
  category,
  sort,
  page,
}: {
  status: string
  course: string
  category: string
  sort: string
  page: number
}) {
  const params = new URLSearchParams()

  if (status !== 'all') params.set('status', status)
  if (course) params.set('course', course)
  if (category !== 'all') params.set('category', category)
  if (sort !== 'submitted_desc') params.set('sort', sort)
  if (page > 1) params.set('page', String(page))

  const query = params.toString()
  return query ? `/college/applications?${query}` : '/college/applications'
}

export default async function CollegeApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    course?: string
    category?: string
    sort?: string
    page?: string
  }>
}) {
  const user = await requireAuth(['college'])
  const college = await getCollegeRecordForUser(user.id)

  if (!college) {
    return null
  }

  const resolvedSearchParams = await searchParams
  const status = getCollegeApplicantStatusFilter(resolvedSearchParams.status)
  const course = resolvedSearchParams.course || ''
  const category = getCollegeApplicantCategoryFilter(resolvedSearchParams.category)
  const sort = getCollegeApplicantSort(resolvedSearchParams.sort)
  const page = parsePositivePage(resolvedSearchParams.page)

  const result = await getCollegeApplicationsList({
    collegeId: college.id,
    status,
    courseId: course || undefined,
    category,
    sort,
    page,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const currentPage = Math.min(page, totalPages)
  const rangeStart = result.total === 0 ? 0 : (currentPage - 1) * result.pageSize + 1
  const rangeEnd = Math.min(currentPage * result.pageSize, result.total)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 animate-page-enter">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-md-primary">
            Applicant Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            Applications for {college.name}
          </h1>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            Filter by course, status, and category, then search the current page by student name.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/api/college/applications/export">Export CSV</a>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/dashboard">Back to Overview</Link>
          </Button>
        </div>
      </div>

      <Card elevation="elevated" className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Filters</CardTitle>
          <CardDescription>
            Current view: {formatStatusFilter(status)}, {formatCategoryFilter(category)}, {formatSortOption(sort)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-md-on-surface">Status</label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="h-14 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface focus:border-md-primary focus:outline-none"
              >
                {collegeApplicantStatuses.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusFilter(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="course" className="mb-1 block text-sm font-medium text-md-on-surface">Course</label>
              <select
                id="course"
                name="course"
                defaultValue={course}
                className="h-14 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface focus:border-md-primary focus:outline-none"
              >
                <option value="">All courses</option>
                {result.courseOptions.map((courseOption) => (
                  <option key={courseOption.id} value={courseOption.id}>
                    {courseOption.degree ? `${courseOption.name} (${courseOption.degree})` : courseOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium text-md-on-surface">Category</label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                className="h-14 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface focus:border-md-primary focus:outline-none"
              >
                {collegeApplicantCategories.map((item) => (
                  <option key={item} value={item}>
                    {formatCategoryFilter(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="mb-1 block text-sm font-medium text-md-on-surface">Sort by</label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className="h-14 w-full rounded-t-lg border-b-2 border-md-outline bg-md-surface-container-low px-4 text-md-on-surface focus:border-md-primary focus:outline-none"
              >
                {collegeApplicantSortOptions.map((item) => (
                  <option key={item} value={item}>
                    {formatSortOption(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <Button type="submit" className="flex-1">Apply Filters</Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/college/applications">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Applicants</CardTitle>
          <CardDescription>
            Showing {rangeStart}-{rangeEnd} of {result.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.applications.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No applications match the selected filters yet.
            </div>
          ) : (
            <ApplicantsTableClient applications={result.applications} />
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button asChild variant="outline" disabled={currentPage <= 1}>
            <Link
              href={getPageHref({
                status,
                course,
                category,
                sort,
                page: Math.max(1, currentPage - 1),
              })}
              aria-disabled={currentPage <= 1}
            >
              Previous
            </Link>
          </Button>
          <span className="text-sm text-md-on-surface-variant">
            Page {currentPage} of {totalPages}
          </span>
          <Button asChild variant="outline" disabled={currentPage >= totalPages}>
            <Link
              href={getPageHref({
                status,
                course,
                category,
                sort,
                page: Math.min(totalPages, currentPage + 1),
              })}
              aria-disabled={currentPage >= totalPages}
            >
              Next
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
