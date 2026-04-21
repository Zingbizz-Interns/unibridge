import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  sql,
  type SQL,
} from 'drizzle-orm'
import {
  applicationStatusHistory,
  applications,
  colleges,
  courses,
  users,
} from '@/db/schema'
import { db } from '@/lib/db'

export const collegeApplicantStatuses = [
  'all',
  'submitted',
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
] as const

export const collegeApplicantSortOptions = [
  'submitted_desc',
  'submitted_asc',
  'twelfth_desc',
  'entrance_desc',
] as const

export const collegeApplicantCategories = [
  'all',
  'general',
  'obc',
  'sc',
  'st',
  'ews',
] as const

export const collegeManagedStatuses = [
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
] as const

export const collegeApplicationsPageSize = 20

export type CollegeApplicantStatusFilter = (typeof collegeApplicantStatuses)[number]
export type CollegeApplicantSort = (typeof collegeApplicantSortOptions)[number]
export type CollegeApplicantCategoryFilter = (typeof collegeApplicantCategories)[number]
export type CollegeManagedStatus = (typeof collegeManagedStatuses)[number]

export type CollegeApplicationListItem = {
  id: string
  status: string | null
  submittedAt: Date | null
  updatedAt: Date | null
  category: string | null
  twelfthPercent: string | null
  entranceScore: string | null
  phone: string | null
  studentName: string
  studentEmail: string
  courseId: string | null
  courseName: string | null
  courseDegree: string | null
}

export type CollegeApplicationDetail = {
  id: string
  status: string | null
  submittedAt: Date | null
  updatedAt: Date | null
  dob: string | null
  gender: string | null
  category: string | null
  phone: string | null
  tenthPercent: string | null
  twelfthPercent: string | null
  entranceExam: string | null
  entranceScore: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  notes: string | null
  studentId: string
  studentName: string
  studentEmail: string
  courseId: string | null
  courseName: string | null
  courseDegree: string | null
  collegeId: string
  collegeName: string
}

export type ApplicationHistoryItem = {
  id: string
  status: string | null
  note: string | null
  createdAt: Date | null
  changedByName: string | null
  changedByRole: string | null
}

function isStatusFilter(value: string | null | undefined): value is CollegeApplicantStatusFilter {
  return collegeApplicantStatuses.includes((value || 'all') as CollegeApplicantStatusFilter)
}

function isCategoryFilter(
  value: string | null | undefined
): value is CollegeApplicantCategoryFilter {
  return collegeApplicantCategories.includes((value || 'all') as CollegeApplicantCategoryFilter)
}

function isSortOption(value: string | null | undefined): value is CollegeApplicantSort {
  return collegeApplicantSortOptions.includes((value || 'submitted_desc') as CollegeApplicantSort)
}

export function getCollegeApplicantStatusFilter(value?: string | null) {
  return isStatusFilter(value) ? value : 'all'
}

export function getCollegeApplicantCategoryFilter(value?: string | null) {
  return isCategoryFilter(value) ? value : 'all'
}

export function getCollegeApplicantSort(value?: string | null) {
  return isSortOption(value) ? value : 'submitted_desc'
}

export function parsePositivePage(value?: string | null) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return Math.floor(parsed)
}

export async function getCollegeRecordForUser(userId: string) {
  const [college] = await db
    .select({
      id: colleges.id,
      name: colleges.name,
      slug: colleges.slug,
      verificationStatus: colleges.verificationStatus,
    })
    .from(colleges)
    .where(eq(colleges.userId, userId))
    .limit(1)

  return college ?? null
}

function getApplicantFilters({
  collegeId,
  status,
  courseId,
  category,
}: {
  collegeId: string
  status: CollegeApplicantStatusFilter
  courseId?: string | null
  category: CollegeApplicantCategoryFilter
}) {
  const filters: SQL[] = [eq(applications.collegeId, collegeId)]

  if (status !== 'all') {
    filters.push(eq(applications.status, status))
  }

  if (courseId) {
    filters.push(eq(applications.courseId, courseId))
  }

  if (category !== 'all') {
    filters.push(eq(applications.category, category))
  }

  return filters
}

function getSortOrder(sort: CollegeApplicantSort) {
  switch (sort) {
    case 'submitted_asc':
      return [asc(applications.submittedAt), asc(users.name)]
    case 'twelfth_desc':
      return [desc(applications.twelfthPercent), desc(applications.submittedAt)]
    case 'entrance_desc':
      return [desc(applications.entranceScore), desc(applications.submittedAt)]
    case 'submitted_desc':
    default:
      return [desc(applications.submittedAt), asc(users.name)]
  }
}

export async function getCollegeApplicationsList({
  collegeId,
  status,
  courseId,
  category,
  sort,
  page,
}: {
  collegeId: string
  status: CollegeApplicantStatusFilter
  courseId?: string | null
  category: CollegeApplicantCategoryFilter
  sort: CollegeApplicantSort
  page: number
}) {
  const filters = getApplicantFilters({ collegeId, status, courseId, category })
  const whereClause = filters.length === 1 ? filters[0] : and(...filters)
  const offset = (page - 1) * collegeApplicationsPageSize

  const [{ total }] = await db
    .select({ total: count() })
    .from(applications)
    .where(whereClause)

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      category: applications.category,
      twelfthPercent: applications.twelfthPercent,
      entranceScore: applications.entranceScore,
      phone: applications.phone,
      studentName: users.name,
      studentEmail: users.email,
      courseId: applications.courseId,
      courseName: courses.name,
      courseDegree: courses.degree,
    })
    .from(applications)
    .innerJoin(users, eq(applications.studentId, users.id))
    .leftJoin(courses, eq(applications.courseId, courses.id))
    .where(whereClause)
    .orderBy(...getSortOrder(sort))
    .limit(collegeApplicationsPageSize)
    .offset(offset)

  const courseOptions = await db
    .select({
      id: courses.id,
      name: courses.name,
      degree: courses.degree,
    })
    .from(courses)
    .where(eq(courses.collegeId, collegeId))
    .orderBy(asc(courses.name))

  return {
    applications: rows satisfies CollegeApplicationListItem[],
    courseOptions,
    total,
    page,
    pageSize: collegeApplicationsPageSize,
  }
}

export async function getCollegeApplicationOverview(collegeId: string) {
  const [statsRow] = await db
    .select({
      total: sql<number>`count(*)`,
      pendingReview: sql<number>`count(*) filter (where ${applications.status} in ('submitted', 'under_review'))`,
      shortlisted: sql<number>`count(*) filter (where ${applications.status} = 'shortlisted')`,
      accepted: sql<number>`count(*) filter (where ${applications.status} = 'accepted')`,
      rejected: sql<number>`count(*) filter (where ${applications.status} = 'rejected')`,
      thisWeek: sql<number>`count(*) filter (where ${applications.submittedAt} >= now() - interval '6 days')`,
    })
    .from(applications)
    .where(eq(applications.collegeId, collegeId))

  const sixDaysAgo = new Date()
  sixDaysAgo.setHours(0, 0, 0, 0)
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

  const sparklineSource = await db
    .select({ submittedAt: applications.submittedAt })
    .from(applications)
    .where(
      and(
        eq(applications.collegeId, collegeId),
        gte(applications.submittedAt, sixDaysAgo)
      )
    )

  const sparkline = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sixDaysAgo)
    date.setDate(sixDaysAgo.getDate() + index)

    const countForDay = sparklineSource.filter((row) => {
      if (!row.submittedAt) {
        return false
      }

      const submittedAt = new Date(row.submittedAt)
      return (
        submittedAt.getFullYear() === date.getFullYear()
        && submittedAt.getMonth() === date.getMonth()
        && submittedAt.getDate() === date.getDate()
      )
    }).length

    return {
      label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: countForDay,
    }
  })

  const recentApplications = await db
    .select({
      id: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      studentName: users.name,
      courseName: courses.name,
      courseDegree: courses.degree,
    })
    .from(applications)
    .innerJoin(users, eq(applications.studentId, users.id))
    .leftJoin(courses, eq(applications.courseId, courses.id))
    .where(eq(applications.collegeId, collegeId))
    .orderBy(desc(applications.submittedAt))
    .limit(10)

  return {
    stats: {
      total: statsRow?.total ?? 0,
      pendingReview: statsRow?.pendingReview ?? 0,
      shortlisted: statsRow?.shortlisted ?? 0,
      accepted: statsRow?.accepted ?? 0,
      rejected: statsRow?.rejected ?? 0,
      thisWeek: statsRow?.thisWeek ?? 0,
      sparkline,
    },
    recentApplications,
  }
}

export async function getCollegeApplicationDetail({
  collegeId,
  applicationId,
}: {
  collegeId: string
  applicationId: string
}) {
  const [application] = await db
    .select({
      id: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      updatedAt: applications.updatedAt,
      dob: applications.dob,
      gender: applications.gender,
      category: applications.category,
      phone: applications.phone,
      tenthPercent: applications.tenthPercent,
      twelfthPercent: applications.twelfthPercent,
      entranceExam: applications.entranceExam,
      entranceScore: applications.entranceScore,
      address: applications.address,
      city: applications.city,
      state: applications.state,
      pincode: applications.pincode,
      notes: applications.notes,
      studentId: applications.studentId,
      studentName: users.name,
      studentEmail: users.email,
      courseId: applications.courseId,
      courseName: courses.name,
      courseDegree: courses.degree,
      collegeId: colleges.id,
      collegeName: colleges.name,
    })
    .from(applications)
    .innerJoin(users, eq(applications.studentId, users.id))
    .innerJoin(colleges, eq(applications.collegeId, colleges.id))
    .leftJoin(courses, eq(applications.courseId, courses.id))
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.collegeId, collegeId)
      )
    )
    .limit(1)

  if (!application) {
    return null
  }

  const history = await getApplicationHistory(application.id)

  return {
    application: application satisfies CollegeApplicationDetail,
    history,
  }
}

export async function getApplicationHistory(applicationId: string) {
  const history = await db
    .select({
      id: applicationStatusHistory.id,
      status: applicationStatusHistory.status,
      note: applicationStatusHistory.note,
      createdAt: applicationStatusHistory.createdAt,
      changedByName: users.name,
      changedByRole: users.role,
    })
    .from(applicationStatusHistory)
    .leftJoin(users, eq(applicationStatusHistory.changedByUserId, users.id))
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(asc(applicationStatusHistory.createdAt))

  return history satisfies ApplicationHistoryItem[]
}

export async function getApplicationsCsvRows(collegeId: string) {
  return db
    .select({
      studentName: users.name,
      studentEmail: users.email,
      phone: applications.phone,
      courseName: courses.name,
      courseDegree: courses.degree,
      category: applications.category,
      tenthPercent: applications.tenthPercent,
      twelfthPercent: applications.twelfthPercent,
      entranceScore: applications.entranceScore,
      status: applications.status,
      appliedAt: applications.submittedAt,
    })
    .from(applications)
    .innerJoin(users, eq(applications.studentId, users.id))
    .leftJoin(courses, eq(applications.courseId, courses.id))
    .where(eq(applications.collegeId, collegeId))
    .orderBy(desc(applications.submittedAt))
}

export function getStatusUpdateEmail(status: CollegeManagedStatus, collegeName: string, courseLabel: string) {
  switch (status) {
    case 'shortlisted':
      return {
        subject: `You have been shortlisted by ${collegeName}`,
        html: `<p>Great news!</p><p>You've been shortlisted at <strong>${collegeName}</strong> for <strong>${courseLabel}</strong>.</p><p>Please keep an eye on your UniBridge dashboard for next steps.</p><br/>Best,<br/>UniBridge Team`,
      }
    case 'accepted':
      return {
        subject: `Application accepted by ${collegeName}`,
        html: `<p>Congratulations!</p><p>Your application to <strong>${collegeName}</strong> for <strong>${courseLabel}</strong> has been accepted.</p><p>Please log in to UniBridge to review the latest update.</p><br/>Best,<br/>UniBridge Team`,
      }
    case 'rejected':
      return {
        subject: `Application update from ${collegeName}`,
        html: `<p>Hello,</p><p>We regret to inform you that your application to <strong>${collegeName}</strong> for <strong>${courseLabel}</strong> was not successful.</p><p>You can still explore other options on UniBridge.</p><br/>Best,<br/>UniBridge Team`,
      }
    case 'under_review':
    default:
      return {
        subject: `Application under review at ${collegeName}`,
        html: `<p>Hello,</p><p>Your application to <strong>${collegeName}</strong> for <strong>${courseLabel}</strong> is now under review.</p><p>We will email you again when the college shares another update.</p><br/>Best,<br/>UniBridge Team`,
      }
  }
}

export async function backfillApplicationHistoryForIds(applicationIds: string[]) {
  if (applicationIds.length === 0) {
    return
  }

  const existingHistory = await db
    .select({ applicationId: applicationStatusHistory.applicationId })
    .from(applicationStatusHistory)
    .where(inArray(applicationStatusHistory.applicationId, applicationIds))

  const knownIds = new Set(existingHistory.map((item) => item.applicationId))
  const missingIds = applicationIds.filter((id) => !knownIds.has(id))

  if (missingIds.length === 0) {
    return
  }

  const missingApplications = await db
    .select({
      id: applications.id,
      status: applications.status,
      submittedAt: applications.submittedAt,
      studentId: applications.studentId,
    })
    .from(applications)
    .where(inArray(applications.id, missingIds))

  if (missingApplications.length === 0) {
    return
  }

  await db.insert(applicationStatusHistory).values(
    missingApplications.map((application) => ({
      applicationId: application.id,
      status: application.status ?? 'submitted',
      note: 'Imported existing application status.',
      changedByUserId: application.studentId,
      createdAt: application.submittedAt ?? new Date(),
    }))
  )
}
