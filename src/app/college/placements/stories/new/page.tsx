import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { requireAuth } from '@/lib/session'
import StoriesManager from './StoriesManager'

export default async function CollegeStoriesPage() {
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
            Success Stories
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            Student Stories for {college.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-md-on-surface-variant">
            Publish standout outcomes with a student photo, role, company, and a short quote for your public college page.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/college/placements/drives">Manage Campus Drives</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/college/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      <StoriesManager />
    </div>
  )
}
