import { auth } from '@/lib/auth'
import {
  getApplicationsCsvRows,
  getCollegeRecordForUser,
} from '@/lib/college-applications'

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function formatCsvDate(value: Date | null) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString()
}

export async function GET() {
  const session = await auth()

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (session.user.role !== 'college') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const college = await getCollegeRecordForUser(session.user.id)

  if (!college) {
    return new Response(JSON.stringify({ error: 'College profile not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const rows = await getApplicationsCsvRows(college.id)

  const csvRows = [
    [
      'name',
      'email',
      'phone',
      'course',
      'category',
      '10th%',
      '12th%',
      'entranceScore',
      'status',
      'appliedAt',
    ].join(','),
    ...rows.map((row) =>
      [
        row.studentName,
        row.studentEmail,
        row.phone || '',
        row.courseName
          ? row.courseDegree
            ? `${row.courseName} (${row.courseDegree})`
            : row.courseName
          : '',
        row.category || '',
        row.tenthPercent || '',
        row.twelfthPercent || '',
        row.entranceScore || '',
        row.status || '',
        formatCsvDate(row.appliedAt),
      ]
        .map((value) => escapeCsvValue(String(value)))
        .join(',')
    ),
  ].join('\n')

  return new Response(csvRows, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="applicants-${college.slug}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
