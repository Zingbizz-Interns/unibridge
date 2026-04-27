import { and, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { colleges, documents } from '@/db/schema'
import { db } from '@/lib/db'
import { needsCollegeOnboarding } from '@/lib/college-onboarding'
import { requireAuth } from '@/lib/session'
import { storageBuckets } from '@/lib/storage'
import { CollegeSettingsClient } from './CollegeSettingsClient'

export default async function CollegeSettingsPage() {
  const user = await requireAuth(['college'])

  const [college] = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      category: colleges.category,
      collegeType: colleges.collegeType,
      type: colleges.type,
      city: colleges.city,
      state: colleges.state,
      pincode: colleges.pincode,
      affiliation: colleges.affiliation,
      naacGrade: colleges.naacGrade,
      nirfRank: colleges.nirfRank,
      engineeringCutoff: colleges.engineeringCutoff,
      medicalCutoff: colleges.medicalCutoff,
      website: colleges.website,
      description: colleges.description,
      counsellorEmail: colleges.counsellorEmail,
      counsellorPhone: colleges.counsellorPhone,
      verificationStatus: colleges.verificationStatus,
      logoUrl: colleges.logoUrl,
      bannerUrl: colleges.bannerUrl,
      latitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_Y(${colleges.location}) END`,
      longitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_X(${colleges.location}) END`,
    })
    .from(colleges)
    .where(eq(colleges.userId, user.id))
    .limit(1)

  if (!college || !college.verificationStatus) {
    redirect('/college/dashboard')
  }

  const collegeDocuments = await db
    .select({
      id: documents.id,
      type: documents.type,
      fileName: documents.fileName,
    })
    .from(documents)
    .where(
      and(
        eq(documents.collegeId, college.id),
        eq(documents.storageBucket, storageBuckets.verification)
      )
    )

  if (needsCollegeOnboarding(college, collegeDocuments.map((doc) => doc.type))) {
    redirect('/college/onboarding')
  }

  const collegeForClient: Parameters<typeof CollegeSettingsClient>[0]['college'] = {
    ...college,
    engineeringCutoff:
      college.engineeringCutoff !== null
      && college.engineeringCutoff !== undefined
        ? Number(college.engineeringCutoff)
        : null,
    medicalCutoff:
      college.medicalCutoff !== null
      && college.medicalCutoff !== undefined
        ? Number(college.medicalCutoff)
        : null,
    verificationStatus: college.verificationStatus,
  }

  return (
    <CollegeSettingsClient
      college={collegeForClient}
      documents={collegeDocuments}
    />
  )
}
