'use client'

import { useState } from 'react'
import Link from 'next/link'
import ApplicationStatusBadge from '@/components/ApplicationStatusBadge'
import { Input } from '@/components/ui/Input'
import type { CollegeApplicationListItem } from '@/lib/college-applications'

function formatDate(value: Date | string | null) {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatScore(value: string | null, suffix = '') {
  if (!value) {
    return 'N/A'
  }

  return `${value}${suffix}`
}

export default function ApplicantsTableClient({
  applications,
}: {
  applications: CollegeApplicationListItem[]
}) {
  const [search, setSearch] = useState('')

  const visibleApplications = applications.filter((application) =>
    application.studentName.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="max-w-md">
        <label htmlFor="studentSearch" className="mb-1 block text-sm font-medium text-md-on-surface">
          Search by student name
        </label>
        <Input
          id="studentSearch"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Start typing a student name"
        />
      </div>

      {visibleApplications.length === 0 ? (
        <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
          No applicants match the current search on this page.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-md-outline/15">
          <table className="min-w-full text-left">
            <thead className="bg-md-surface">
              <tr className="text-sm text-md-on-surface-variant">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course Applied</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">12th %</th>
                <th className="px-4 py-3 font-medium">Entrance Score</th>
                <th className="px-4 py-3 font-medium">Applied On</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-md-outline/10 bg-md-surface-container-low">
              {visibleApplications.map((application) => (
                <tr key={application.id}>
                  <td className="px-4 py-4">
                    <div className="font-medium text-md-on-surface">{application.studentName}</div>
                    <div className="text-sm text-md-on-surface-variant">{application.studentEmail}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                    {application.courseName
                      ? application.courseDegree
                        ? `${application.courseName} (${application.courseDegree})`
                        : application.courseName
                      : 'Course not selected'}
                  </td>
                  <td className="px-4 py-4 text-sm uppercase text-md-on-surface-variant">
                    {application.category || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                    {formatScore(application.twelfthPercent, '%')}
                  </td>
                  <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                    {formatScore(application.entranceScore)}
                  </td>
                  <td className="px-4 py-4 text-sm text-md-on-surface-variant">
                    {formatDate(application.submittedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <ApplicationStatusBadge status={application.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/college/applications/${application.id}`} className="text-sm font-medium text-md-primary hover:underline">
                      View Applicant
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
