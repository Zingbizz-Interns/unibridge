import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { requireAuth } from '@/lib/session'
import DrivesManager from './DrivesManager'

export default async function CollegeDrivesPage() {
  const user = await requireAuth(['college'])
  const college = await getCollegeRecordForUser(user.id)

  if (!college) {
    return null
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-md-primary">
            Placement Tracker
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            Campus Drives for {college.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-md-on-surface-variant">
            Log each campus drive, keep your placement timeline up to date, and surface recent wins on your public profile.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/college/placements/stories/new">Manage Success Stories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <DrivesManager />
    </div>
  )
}
