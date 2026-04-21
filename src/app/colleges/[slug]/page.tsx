import { db } from '@/lib/db'
import {
  applications,
  campusDrives,
  colleges,
  courses,
  documents,
  shortlists,
  successStories,
  users,
} from '@/db/schema'
import { eq, and, asc, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ClientAnalyticsTracker } from '@/components/ClientAnalyticsTracker'
import { ShortlistButton } from '@/components/ShortlistButton'
import { CompareToggleButton } from '@/components/compare/CompareToggleButton'
import EnquiryForm from '@/components/enquiries/EnquiryForm'
import { formatDocumentTypeLabel, isLegacyPublicDocumentType } from '@/lib/college-content'
import { getCurrentUser } from '@/lib/session'
import { getStorageReadableUrl } from '@/lib/storage-utils'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

function formatCurrency(value: string | null) {
  if (!value) return null
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

function formatLpa(value: string | number | null) {
  if (value === null || value === undefined) return null
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numericValue)) return null
  return `${numericValue.toFixed(numericValue % 1 === 0 ? 0 : 1)} LPA`
}

function formatCutoff(value: string | number | null) {
  if (value === null || value === undefined) return null
  const numericValue = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(numericValue)) return null
  return numericValue.toFixed(2)
}

function formatLocation(city: string | null, state: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location unavailable'
}

function normalizeWebsite(website: string | null) {
  if (!website) return null
  try {
    return new URL(website.startsWith('http') ? website : `https://${website}`)
  } catch {
    return null
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = await db.query.colleges.findFirst({
    where: eq(colleges.slug, slug)
  })

  if (!c || c.verificationStatus !== 'approved') {
    notFound()
  }

  const user = await getCurrentUser()
  let isShortlisted = false
  let existingApplicationId: string | null = null
  let studentPhone: string | null = null
  if (user && user.role === 'student') {
    const [existingShortlist, existingApplication, studentData] = await Promise.all([
      db.query.shortlists.findFirst({
        where: and(eq(shortlists.studentId, user.id), eq(shortlists.collegeId, c.id))
      }),
      db.query.applications.findFirst({
        columns: { id: true },
        where: and(eq(applications.studentId, user.id), eq(applications.collegeId, c.id))
      }),
      db
        .select({ phone: users.phone })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1),
    ])

    isShortlisted = Boolean(existingShortlist)
    existingApplicationId = existingApplication?.id ?? null
    studentPhone = studentData[0]?.phone ?? null
  }

  const [courseRows, driveRows, documentRows, storyRows] = await Promise.all([
    db.select().from(courses).where(eq(courses.collegeId, c.id)).orderBy(
      asc(courses.totalFee),
      asc(courses.name)
    ),
    db.select().from(campusDrives).where(eq(campusDrives.collegeId, c.id)).orderBy(
      desc(campusDrives.driveDate),
      desc(campusDrives.createdAt)
    ),
    db.select().from(documents).where(eq(documents.collegeId, c.id)).orderBy(
      desc(documents.uploadedAt)
    ),
    db.select().from(successStories).where(eq(successStories.collegeId, c.id)).orderBy(
      desc(successStories.createdAt)
    ),
  ])

  const storiesWithReadableImages = await Promise.all(
    storyRows.map(async (story) => ({
      ...story,
      imageUrl:
        (await getStorageReadableUrl(story.imageBucket, story.imagePath)) ?? story.imageUrl,
    }))
  )

  const website = normalizeWebsite(c.website)
  const engineeringCutoff = formatCutoff(c.engineeringCutoff)
  const medicalCutoff = formatCutoff(c.medicalCutoff)
  const bestPlacementPercent = courseRows.reduce<number | null>((best, course) => {
    const current = course.placementPercent ? Number(course.placementPercent) : null
    if (current === null || Number.isNaN(current)) return best
    return best === null ? current : Math.max(best, current)
  }, null)
  const bestAvgPackage = courseRows.reduce<string | null>((best, course) => {
    const current = course.avgPackage ? Number(course.avgPackage) : null
    if (current === null || Number.isNaN(current)) return best
    if (best === null || current > Number(best)) return String(current)
    return best
  }, null)
  const highestPlacementCtc = [...driveRows, ...storiesWithReadableImages].reduce<number | null>((best, item) => {
    const current = item.ctc ? Number(item.ctc) : null
    if (current === null || Number.isNaN(current)) return best
    return best === null ? current : Math.max(best, current)
  }, null)
  const publicDocuments = documentRows.filter(
    (document) => document.publicUrl && isLegacyPublicDocumentType(document.type)
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ClientAnalyticsTracker collegeId={c.id} eventType="view_college" />

      {/* Hero card */}
      <Card className="overflow-hidden mb-8">
        <div className="bg-gradient-to-br from-md-primary to-md-tertiary h-32 md:h-48 relative">
          <div className="absolute inset-0 bg-md-primary/20 blur-3xl" aria-hidden="true" />
        </div>
        <div className="px-6 pb-6 relative">
          <div className="h-24 w-24 md:h-32 md:w-32 bg-md-surface rounded-3xl shadow-md border border-md-outline/10 flex items-center justify-center p-2 absolute -top-12 md:-top-16">
            {c.logoUrl ? (
              <img src={c.logoUrl} alt={c.name} className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-md-on-surface-variant font-bold text-3xl">{c.name.charAt(0)}</div>
            )}
          </div>

          <div className="mt-16 md:mt-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-medium text-md-on-surface">{c.name}</h1>
              <p className="text-md-on-surface-variant mt-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                {formatLocation(c.city, c.state)}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {!user || user.role === 'student' ? (
                existingApplicationId ? (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/applications/${existingApplicationId}`}>View Application</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href={`/apply/${c.id}`}>Apply Now</Link>
                  </Button>
                )
              ) : null}
              <CompareToggleButton
                college={{ id: c.id, name: c.name, slug: c.slug }}
              />
              <ShortlistButton collegeId={c.id} initialIsShortlisted={isShortlisted} />
              {website ? (
                <Button variant="outline" asChild>
                  <a href={website.href} target="_blank" rel="noreferrer">Visit Website</a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* About section */}
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {c.description ? (
                <p className="text-md-on-surface-variant leading-relaxed">{c.description}</p>
              ) : (
                <p className="italic text-md-on-surface-variant/60">No description provided yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Courses & Fees */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Courses & Fees</CardTitle>
              <span className="text-sm text-md-on-surface-variant">{courseRows.length} course(s)</span>
            </CardHeader>
            <CardContent>
              {courseRows.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-md-outline/10">
                  <table className="min-w-full divide-y divide-md-outline/10 text-sm">
                    <thead>
                      <tr className="text-left text-md-on-surface-variant bg-md-surface">
                        <th className="py-3 px-4 font-medium">Course</th>
                        <th className="py-3 px-4 font-medium">Degree</th>
                        <th className="py-3 px-4 font-medium">Duration</th>
                        <th className="py-3 px-4 font-medium">Total Fee</th>
                        <th className="py-3 px-4 font-medium">Placement %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-md-outline/10">
                      {courseRows.map((course) => (
                        <tr key={course.id} className="hover:bg-md-primary/5 transition-colors">
                          <td className="py-3 px-4 font-medium text-md-on-surface">{course.name}</td>
                          <td className="py-3 px-4 text-md-on-surface-variant">{course.degree || 'NA'}</td>
                          <td className="py-3 px-4 text-md-on-surface-variant">
                            {course.duration ? `${course.duration} years` : 'NA'}
                          </td>
                          <td className="py-3 px-4 text-md-on-surface-variant">
                            {formatCurrency(course.totalFee) || 'NA'}
                          </td>
                          <td className="py-3 px-4 text-md-on-surface-variant">
                            {course.placementPercent ? `${course.placementPercent}%` : 'NA'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-md-on-surface-variant">Course information has not been published yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Placements */}
          <Card>
            <CardHeader>
              <CardTitle>Placements</CardTitle>
            </CardHeader>
            <CardContent>
              {bestPlacementPercent !== null || bestAvgPackage !== null || driveRows.length > 0 ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-md-surface p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">Best Placement Rate</p>
                      <p className="mt-2 text-2xl font-medium text-md-on-surface">
                        {bestPlacementPercent !== null ? `${bestPlacementPercent}%` : 'NA'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-md-surface p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">Highest Average Package</p>
                      <p className="mt-2 text-2xl font-medium text-md-on-surface">
                        {formatLpa(bestAvgPackage) || 'NA'}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-md-surface p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-md-on-surface-variant">Highest CTC</p>
                      <p className="mt-2 text-2xl font-medium text-md-on-surface">
                        {formatLpa(highestPlacementCtc) || 'NA'}
                      </p>
                    </div>
                  </div>

                  {driveRows.length > 0 ? (
                    <div>
                      <h3 className="font-medium text-md-on-surface mb-3">Recent Campus Drives</h3>
                      <div className="space-y-3">
                        {driveRows.slice(0, 5).map((drive) => (
                          <div
                            key={drive.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-md-surface p-4 transition-all duration-300 hover:shadow-sm"
                          >
                            <div>
                              <p className="font-medium text-md-on-surface">{drive.companyName}</p>
                              <p className="text-sm text-md-on-surface-variant">
                                {drive.role || 'Role not specified'}
                              </p>
                            </div>
                            <div className="text-sm text-md-on-surface-variant">
                              <p>{formatLpa(drive.ctc) || 'CTC not shared'}</p>
                              <p>
                                {drive.driveDate
                                  ? new Date(drive.driveDate).toLocaleDateString('en-IN')
                                  : 'Date not shared'}
                              </p>
                              <p>
                                {drive.studentsPlaced !== null
                                  ? `${drive.studentsPlaced} students placed`
                                  : 'Count not shared'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {storiesWithReadableImages.length > 0 ? (
                    <div>
                      <h3 className="font-medium text-md-on-surface mb-3">Success Stories</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {storiesWithReadableImages.slice(0, 4).map((story) => (
                          <Card key={story.id} interactive className="overflow-hidden">
                            <div className="h-48 bg-md-surface-container-low">
                              {story.imageUrl ? (
                                <div
                                  className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                                  style={{ backgroundImage: `url(${story.imageUrl})` }}
                                  role="img"
                                  aria-label={story.studentName}
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-sm text-md-on-surface-variant">
                                  Student photo
                                </div>
                              )}
                            </div>
                            <div className="space-y-3 p-4">
                              <div>
                                <p className="text-lg font-medium text-md-on-surface">{story.studentName}</p>
                                <p className="text-sm text-md-on-surface-variant">
                                  Batch {story.batch || 'N/A'}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-md-secondary-container text-md-on-secondary-container text-xs rounded-full font-medium">{story.company || 'Company'}</span>
                                <span className="px-3 py-1 bg-md-primary/10 text-md-primary text-xs rounded-full font-medium">{formatLpa(story.ctc) || 'Package N/A'}</span>
                              </div>
                              <p className="text-sm leading-6 text-md-on-surface-variant">
                                {story.story || 'Story coming soon.'}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-md-on-surface-variant">Placement insights will appear once colleges add them.</p>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents & Downloads</CardTitle>
              <span className="text-sm text-md-on-surface-variant">{publicDocuments.length} public file(s)</span>
            </CardHeader>
            <CardContent>
              {publicDocuments.length > 0 ? (
                <div className="space-y-3">
                  {publicDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-md-surface p-4"
                    >
                      <div>
                        <p className="font-medium text-md-on-surface">
                          {document.fileName || formatDocumentTypeLabel(document.type)}
                        </p>
                        <p className="text-sm text-md-on-surface-variant capitalize">
                          {formatDocumentTypeLabel(document.type)}
                        </p>
                      </div>
                      {document.publicUrl ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={document.publicUrl} target="_blank" rel="noreferrer">
                            Download
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-md-on-surface-variant">Brochures, fee details, and disclosures are not available yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Enquiry form */}
          {!user || user.role === 'student' ? (
            <EnquiryForm
              collegeId={c.id}
              collegeName={c.name}
              currentUser={
                user?.role === 'student'
                  ? {
                      name: user.name,
                      email: user.email,
                      phone: studentPhone,
                    }
                  : null
              }
            />
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Facts</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {c.category && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">Category</span>
                    <span className="font-medium text-md-on-surface capitalize">
                      {c.category.replace('_', ' & ')}
                    </span>
                  </li>
                )}
                {c.collegeType && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">Type</span>
                    <span className="font-medium text-md-on-surface capitalize">{c.collegeType}</span>
                  </li>
                )}
                {c.type && !c.collegeType && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">Institution Type</span>
                    <span className="font-medium text-md-on-surface">{c.type}</span>
                  </li>
                )}
                {c.nirfRank && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">NIRF Ranking</span>
                    <span className="font-medium text-md-on-surface">#{c.nirfRank}</span>
                  </li>
                )}
                {c.naacGrade && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">NAAC Grade</span>
                    <span className="font-medium text-md-on-surface">{c.naacGrade}</span>
                  </li>
                )}
                {engineeringCutoff && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">Engineering Cut-off</span>
                    <span className="font-medium text-md-on-surface">{engineeringCutoff}</span>
                  </li>
                )}
                {medicalCutoff && (
                  <li className="flex justify-between border-b border-md-outline/10 pb-2">
                    <span className="text-md-on-surface-variant">Medical Cut-off</span>
                    <span className="font-medium text-md-on-surface">{medicalCutoff}</span>
                  </li>
                )}
                {c.affiliation && (
                  <li className="flex justify-between pt-1">
                    <span className="text-md-on-surface-variant">Affiliation</span>
                    <span className="font-medium text-md-on-surface text-right">{c.affiliation}</span>
                  </li>
                )}
                {website && (
                  <li className="flex justify-between pt-1">
                    <span className="text-md-on-surface-variant">Official Website</span>
                    <a href={website.href} target="_blank" rel="noreferrer" className="font-medium text-md-primary hover:text-md-primary/80 transition-colors overflow-hidden text-ellipsis max-w-[150px]">
                      {website.hostname.replace('www.', '')}
                    </a>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Helpful Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-sm">
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link href="/colleges">Back to all colleges</Link>
                </Button>
                {!user || user.role === 'student' ? (
                  existingApplicationId ? (
                    <Button variant="ghost" size="sm" asChild className="justify-start">
                      <Link href={`/dashboard/applications/${existingApplicationId}`}>
                        View your application
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" asChild className="justify-start">
                      <Link href={`/apply/${c.id}`}>Apply to this college</Link>
                    </Button>
                  )
                ) : null}
                {website ? (
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <a href={website.href} target="_blank" rel="noreferrer">
                      Visit official website
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
