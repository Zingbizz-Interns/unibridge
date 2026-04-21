import { and, eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { colleges, documents } from '@/db/schema'
import { db } from '@/lib/db'
import { needsCollegeOnboarding } from '@/lib/college-onboarding'
import { requireAuth } from '@/lib/session'
import { storageBuckets } from '@/lib/storage'
import { type CollegeProfileInput } from '@/validators/college-profile'
import { CollegeOnboardingClient } from './CollegeOnboardingClient'

export default async function CollegeOnboardingPage() {
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
      latitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_Y(${colleges.location}) END`,
      longitude: sql<number | null>`CASE WHEN ${colleges.location} IS NULL THEN NULL ELSE ST_X(${colleges.location}) END`,
    })
    .from(colleges)
    .where(eq(colleges.userId, user.id))
    .limit(1)

  if (!college || !college.verificationStatus) {
    redirect('/college/dashboard')
  }

  if (
    college.verificationStatus === 'approved'
    || college.verificationStatus === 'rejected'
    || college.verificationStatus === 'suspended'
  ) {
    redirect('/college/settings')
  }

  const collegeDocuments = await db
    .select({ type: documents.type })
    .from(documents)
    .where(
      and(
        eq(documents.collegeId, college.id),
        eq(documents.storageBucket, storageBuckets.verification)
      )
    )

  if (!needsCollegeOnboarding(college, collegeDocuments.map((doc) => doc.type))) {
    redirect('/college/dashboard')
  }

  const initialProfile: CollegeProfileInput = {
    name: college.name,
    category: (college.category ?? undefined) as CollegeProfileInput['category'],
    collegeType: (college.collegeType ?? undefined) as CollegeProfileInput['collegeType'],
    type: (college.type ?? undefined) as CollegeProfileInput['type'],
    city: college.city ?? '',
    state: (college.state ?? undefined) as CollegeProfileInput['state'],
    pincode: college.pincode ?? '',
    affiliation: college.affiliation ?? '',
    naacGrade: (college.naacGrade ?? undefined) as CollegeProfileInput['naacGrade'],
    nirfRank: college.nirfRank ?? undefined,
    engineeringCutoff:
      college.engineeringCutoff !== null
      && college.engineeringCutoff !== undefined
        ? Number(college.engineeringCutoff)
        : undefined,
    medicalCutoff:
      college.medicalCutoff !== null
      && college.medicalCutoff !== undefined
        ? Number(college.medicalCutoff)
        : undefined,
    website: college.website ?? '',
    description: college.description ?? '',
    counsellorEmail: college.counsellorEmail ?? '',
    counsellorPhone: college.counsellorPhone ?? '',
    latitude: undefined,
    longitude: undefined,
  }

  return <CollegeOnboardingClient initialProfile={initialProfile} />
}
