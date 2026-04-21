import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getCollegeRecordForUser } from '@/lib/college-applications'
import { requireAuth } from '@/lib/session'
import PublicDocumentsManager from './PublicDocumentsManager'

export default async function CollegeDocumentsPage() {
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
            Document Vault
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-md-on-surface">
            Public Documents for {college.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-md-on-surface-variant">
            Upload brochures, fee details, accreditation files, and disclosures that students can download directly from your public profile.
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

      <PublicDocumentsManager />
    </div>
  )
}
