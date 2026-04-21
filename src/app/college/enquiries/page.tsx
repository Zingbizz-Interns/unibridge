import { requireAuth } from '@/lib/session'
import CollegeEnquiriesInbox from './CollegeEnquiriesInbox'

export default async function CollegeEnquiriesPage() {
  await requireAuth(['college'])

  return <CollegeEnquiriesInbox />
}
