import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdminCollegeActions } from '@/components/admin/AdminCollegeActions'
import { AdminCollegeStatusBadge, formatCollegeStatus } from '@/components/admin/AdminCollegeStatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAdminCollegeDetails } from '@/lib/admin-dashboard'

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

export default async function AdminCollegeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const college = await getAdminCollegeDetails(id)

  if (!college) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-md-on-surface">{college.name}</h1>
            <AdminCollegeStatusBadge status={college.verificationStatus} />
          </div>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            {[college.city, college.state, college.pincode].filter(Boolean).join(', ') || 'Location unavailable'}
          </p>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            College owner: {college.ownerEmail}
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild variant="outline">
            <Link href="/admin/colleges">Back to Colleges</Link>
          </Button>
          <AdminCollegeActions
            collegeId={college.id}
            status={college.verificationStatus}
            redirectOnDelete="/admin/colleges"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card elevation="elevated">
          <CardHeader>
            <CardDescription>Applications</CardDescription>
            <CardTitle className="text-4xl">{college.stats.applications}</CardTitle>
          </CardHeader>
        </Card>
        <Card elevation="elevated">
          <CardHeader>
            <CardDescription>Views</CardDescription>
            <CardTitle className="text-4xl">{college.stats.views}</CardTitle>
          </CardHeader>
        </Card>
        <Card elevation="elevated">
          <CardHeader>
            <CardDescription>Enquiries</CardDescription>
            <CardTitle className="text-4xl">{college.stats.enquiries}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card elevation="elevated">
          <CardHeader>
            <CardTitle className="text-2xl">Profile Details</CardTitle>
            <CardDescription>
              Current profile information visible to admin reviewers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-md-on-surface-variant">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium text-md-on-surface">Status</p>
                <p>{formatCollegeStatus(college.verificationStatus)}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Created</p>
                <p>{formatDate(college.createdAt)}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Type</p>
                <p>{college.type || 'Not provided'}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Affiliation</p>
                <p>{college.affiliation || 'Not provided'}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">NAAC Grade</p>
                <p>{college.naacGrade || 'Not provided'}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">NIRF Rank</p>
                <p>{college.nirfRank ?? 'Not provided'}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Counsellor Email</p>
                <p>{college.counsellorEmail || 'Not provided'}</p>
              </div>
              <div>
                <p className="font-medium text-md-on-surface">Counsellor Phone</p>
                <p>{college.counsellorPhone || 'Not provided'}</p>
              </div>
            </div>
            <div>
              <p className="font-medium text-md-on-surface">Website</p>
              {college.website ? (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-md-primary hover:underline"
                >
                  {college.website}
                </a>
              ) : (
                <p>Not provided</p>
              )}
            </div>
            <div>
              <p className="font-medium text-md-on-surface">Description</p>
              <p>{college.description || 'No description available.'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Verification Documents</CardTitle>
              <CardDescription>
                Review the uploaded verification files directly from the admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {college.documents.length === 0 ? (
                <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
                  No verification documents uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {college.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 rounded-3xl border border-md-outline/10 bg-md-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-md-on-surface">
                          {document.fileName || document.type}
                        </p>
                        <p className="text-sm text-md-on-surface-variant">
                          Uploaded {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={`/api/admin/documents/${document.id}/download?mode=preview`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Preview
                          </a>
                        </Button>
                        <Button asChild variant="tonal" size="sm">
                          <a href={`/api/admin/documents/${document.id}/download`}>
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card elevation="elevated">
            <CardHeader>
              <CardTitle className="text-2xl">Courses</CardTitle>
              <CardDescription>
                Published courses currently associated with this college.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {college.courses.length === 0 ? (
                <div className="rounded-2xl bg-md-surface p-6 text-sm text-md-on-surface-variant">
                  No courses have been added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {college.courses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-3xl border border-md-outline/10 bg-md-surface p-4"
                    >
                      <p className="font-medium text-md-on-surface">{course.name}</p>
                      <p className="text-sm text-md-on-surface-variant">
                        {[course.degree, course.seats ? `${course.seats} seats` : null]
                          .filter(Boolean)
                          .join(' • ') || 'Details unavailable'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
