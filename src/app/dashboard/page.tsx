import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import { shortlists, colleges } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { ShortlistButton } from '@/components/ShortlistButton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CutoffCalculator } from '@/components/CutoffCalculator'
import { getApprovedCollegesWithCutoffs } from '@/lib/cutoff-colleges'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAuth(['student'])
  const collegesForCutoff = await getApprovedCollegesWithCutoffs()

  const myShortlist = await db.select({
    shortlistId: shortlists.id,
    college: {
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      city: colleges.city,
      logoUrl: colleges.logoUrl,
    }
  })
  .from(shortlists)
  .innerJoin(colleges, eq(shortlists.collegeId, colleges.id))
  .where(eq(shortlists.studentId, user.id))
  .orderBy(desc(shortlists.createdAt))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-page-enter">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-md-on-surface">Welcome back, {user.name}</h1>
        <p className="mt-1 text-md-on-surface-variant">Keep track of the colleges you saved for later.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card interactive>
          <Link href="/colleges" className="block p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-md-primary text-md-on-primary text-lg">🔍</span>
              <div>
                <p className="font-medium text-md-on-surface">Explore Colleges</p>
                <p className="text-xs text-md-on-surface-variant">Discover new institutions</p>
              </div>
            </div>
          </Link>
        </Card>
        <Card interactive>
          <Link href="/dashboard/applications" className="block p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-md-secondary-container text-md-on-secondary-container text-lg">📋</span>
              <div>
                <p className="font-medium text-md-on-surface">My Applications</p>
                <p className="text-xs text-md-on-surface-variant">Track your progress</p>
              </div>
            </div>
          </Link>
        </Card>
        <Card interactive>
          <Link href="/compare" className="block p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-md-tertiary/10 text-md-tertiary text-lg">⚖️</span>
              <div>
                <p className="font-medium text-md-on-surface">Compare</p>
                <p className="text-xs text-md-on-surface-variant">Side-by-side analysis</p>
              </div>
            </div>
          </Link>
        </Card>
      </div>

      <div className="mb-10">
        <CutoffCalculator colleges={collegesForCutoff} />
      </div>

      {/* Shortlisted Colleges */}
      <Card elevation="elevated">
        <CardHeader>
          <CardTitle className="text-2xl">Your Shortlisted Colleges</CardTitle>
          <CardDescription>{myShortlist.length} college{myShortlist.length !== 1 ? 's' : ''} saved</CardDescription>
        </CardHeader>

        <CardContent>
          {myShortlist.length === 0 ? (
            <div className="text-center py-12 bg-md-surface rounded-3xl">
              <p className="text-md-on-surface-variant mb-4">You haven&apos;t shortlisted any colleges yet.</p>
              <Button variant="tonal" asChild>
                <Link href="/colleges">Explore Colleges</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myShortlist.map(({ college }) => (
                <Card key={college.id} interactive className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-md-surface-container-low rounded-2xl flex items-center justify-center p-1 shrink-0">
                      {college.logoUrl ? (
                        <img src={college.logoUrl} alt={college.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xs text-md-on-surface-variant font-bold">{college.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-md-on-surface line-clamp-1" title={college.name}>{college.name}</h3>
                      <p className="text-sm text-md-on-surface-variant">{college.city}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-md-outline/10">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/colleges/${college.slug}`}>View</Link>
                    </Button>
                    <ShortlistButton collegeId={college.id} initialIsShortlisted />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
