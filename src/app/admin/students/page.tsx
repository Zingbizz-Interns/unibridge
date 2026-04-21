import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { getAdminStudents, parsePositivePage } from '@/lib/admin-dashboard'

type StudentsPageSearchParams = Promise<{
  search?: string
  page?: string
}>

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

function buildPageHref(page: number, search: string) {
  const params = new URLSearchParams()
  params.set('page', String(page))

  if (search.trim()) {
    params.set('search', search.trim())
  }

  return `/admin/students?${params.toString()}`
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: StudentsPageSearchParams
}) {
  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search?.trim() || ''
  const page = parsePositivePage(resolvedSearchParams.page)
  const limit = 20

  const result = await getAdminStudents({
    search,
    page,
    pageSize: limit,
  })

  const totalPages = Math.max(1, Math.ceil(result.total / limit))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-md-on-surface">Students</h1>
        <p className="mt-2 text-sm text-md-on-surface-variant">
          Track student registrations and their current activity footprint across applications, enquiries, and shortlists.
        </p>
      </div>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Search Students</CardTitle>
          <CardDescription>Find a student by name or email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,auto]">
            <Input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by student name or email"
            />
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Student Directory</CardTitle>
          <CardDescription>
            {result.total} student{result.total === 1 ? '' : 's'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.students.length === 0 ? (
            <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
              No students matched the current search.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-md-outline/10">
              <table className="min-w-full text-left">
                <thead className="bg-md-surface">
                  <tr className="text-sm text-md-on-surface-variant">
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Applications</th>
                    <th className="px-4 py-3 font-medium">Enquiries</th>
                    <th className="px-4 py-3 font-medium">Shortlists</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-md-outline/10 bg-md-surface-container-low">
                  {result.students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-md-on-surface">{student.name}</div>
                        <div className="text-sm text-md-on-surface-variant">{student.email}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {student.phone || 'Not provided'}
                      </td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {formatDate(student.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {student.applications}
                      </td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {student.enquiries}
                      </td>
                      <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                        {student.shortlists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {result.total > limit && (
        <div className="flex items-center justify-between rounded-3xl border border-md-outline/10 bg-md-surface-container px-5 py-4">
          <Button asChild variant="outline" disabled={page <= 1}>
            <a href={buildPageHref(Math.max(1, page - 1), search)}>Previous</a>
          </Button>
          <p className="text-sm text-md-on-surface-variant">
            Page {page} of {totalPages}
          </p>
          <Button asChild variant="outline" disabled={page >= totalPages}>
            <a href={buildPageHref(Math.min(totalPages, page + 1), search)}>Next</a>
          </Button>
        </div>
      )}
    </div>
  )
}
