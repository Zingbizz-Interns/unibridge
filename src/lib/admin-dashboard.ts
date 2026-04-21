import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  sql,
  type SQL,
} from 'drizzle-orm'
import {
  analyticsEvents,
  applicationStatusHistory,
  applications,
  campusDrives,
  colleges,
  courses,
  documents,
  enquiries,
  shortlists,
  successStories,
  users,
} from '@/db/schema'
import { db } from '@/lib/db'
import { storageAdmin, storageBuckets } from '@/lib/storage'

export const adminCollegeStatuses = [
  'all',
  'pending',
  'approved',
  'rejected',
  'suspended',
] as const

export type AdminCollegeStatusFilter = (typeof adminCollegeStatuses)[number]

export function getAdminCollegeStatusFilter(value?: string | null): AdminCollegeStatusFilter {
  return adminCollegeStatuses.includes((value || 'all') as AdminCollegeStatusFilter)
    ? (value || 'all') as AdminCollegeStatusFilter
    : 'all'
}

export function parsePositivePage(value?: string | null) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return Math.floor(parsed)
}

export async function getAdminOverviewStats() {
  const [studentsRow, collegesRow, applicationsRow, acceptedRow, enquiriesRow] =
    await Promise.all([
      db.select({ total: count() }).from(users).where(eq(users.role, 'student')),
      db
        .select({ total: count() })
        .from(colleges)
        .where(eq(colleges.verificationStatus, 'approved')),
      db.select({ total: count() }).from(applications),
      db
        .select({ total: count() })
        .from(applications)
        .where(eq(applications.status, 'accepted')),
      db.select({ total: count() }).from(enquiries),
    ])

  const totalStudents = studentsRow[0]?.total ?? 0
  const totalColleges = collegesRow[0]?.total ?? 0
  const totalApplications = applicationsRow[0]?.total ?? 0
  const totalAccepted = acceptedRow[0]?.total ?? 0
  const totalEnquiries = enquiriesRow[0]?.total ?? 0
  const acceptanceRate =
    totalApplications > 0 ? (totalAccepted / totalApplications) * 100 : 0

  return {
    totalStudents,
    totalColleges,
    totalApplications,
    totalAccepted,
    totalEnquiries,
    acceptanceRate,
  }
}

export async function getTrendingStats() {
  const [cityRows, courseRows] = await Promise.all([
    db
      .select({
        city: colleges.city,
        applications: sql<number>`count(*)::int`,
      })
      .from(applications)
      .innerJoin(colleges, eq(applications.collegeId, colleges.id))
      .where(and(eq(colleges.verificationStatus, 'approved'), isNotNull(colleges.city)))
      .groupBy(colleges.city)
      .orderBy(desc(sql`count(*)`), asc(colleges.city))
      .limit(10),
    db
      .select({
        courseName: courses.name,
        applications: sql<number>`count(*)::int`,
      })
      .from(applications)
      .innerJoin(courses, eq(applications.courseId, courses.id))
      .groupBy(courses.name)
      .orderBy(desc(sql`count(*)`), asc(courses.name))
      .limit(10),
  ])

  return {
    cities: cityRows
      .filter((row) => row.city)
      .map((row) => ({
        label: row.city as string,
        value: row.applications,
      })),
    courses: courseRows.map((row) => ({
      label: row.courseName,
      value: row.applications,
    })),
  }
}

export async function getApplicationsOverTime(period: '7d' | '30d' | '90d' = '30d') {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const rows = await db.execute(sql`
    SELECT
      date_trunc('day', submitted_at) AS day,
      count(*)::int AS count
    FROM applications
    WHERE submitted_at >= ${since}
    GROUP BY day
    ORDER BY day ASC
  `)

  return rows.rows.map((row) => ({
    label: new Date(String(row.day)).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
    value: Number(row.count),
  }))
}

export async function getTopColleges() {
  const [applicationRows, viewRows] = await Promise.all([
    db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.city,
        count(a.id)::int AS applications,
        count(*) FILTER (WHERE a.status = 'accepted')::int AS accepted
      FROM colleges c
      LEFT JOIN applications a ON a.college_id = c.id
      GROUP BY c.id, c.name, c.city
    `),
    db.execute(sql`
      SELECT
        college_id,
        count(*)::int AS views
      FROM analytics_events
      WHERE event_type = 'view_college'
      GROUP BY college_id
    `),
  ])

  const viewsByCollege = new Map<string, number>()
  viewRows.rows.forEach((row) => {
    viewsByCollege.set(String(row.college_id), Number(row.views))
  })

  return applicationRows.rows
    .map((row) => {
      const applicationsCount = Number(row.applications)
      const acceptedCount = Number(row.accepted)
      return {
        id: String(row.id),
        name: String(row.name),
        city: row.city ? String(row.city) : 'City unavailable',
        applications: applicationsCount,
        views: viewsByCollege.get(String(row.id)) ?? 0,
        acceptanceRate:
          applicationsCount > 0 ? (acceptedCount / applicationsCount) * 100 : 0,
      }
    })
    .sort((left, right) => right.applications - left.applications || right.views - left.views)
    .slice(0, 10)
}

export async function getUserGrowth() {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const rows = await db.execute(sql`
    SELECT
      date_trunc('week', created_at) AS week,
      count(*) FILTER (WHERE role = 'student')::int AS students,
      count(*) FILTER (WHERE role = 'college')::int AS colleges
    FROM users
    WHERE created_at >= ${since}
    GROUP BY week
    ORDER BY week ASC
  `)

  return rows.rows.map((row) => ({
    label: new Date(String(row.week)).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
    students: Number(row.students),
    colleges: Number(row.colleges),
  }))
}

export async function getAdminCollegeList({
  status,
  search,
  page,
  pageSize,
}: {
  status: AdminCollegeStatusFilter
  search?: string
  page: number
  pageSize: number
}) {
  const filters: SQL[] = []

  if (status !== 'all') {
    filters.push(eq(colleges.verificationStatus, status))
  }

  const normalizedSearch = search?.trim()
  if (normalizedSearch) {
    filters.push(ilike(colleges.name, `%${normalizedSearch}%`))
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined
  const offset = (page - 1) * pageSize

  const [totalRows, collegeRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(colleges)
      .where(whereClause),
    db
      .select({
        id: colleges.id,
        userId: colleges.userId,
        name: colleges.name,
        slug: colleges.slug,
        city: colleges.city,
        state: colleges.state,
        category: colleges.category,
        collegeType: colleges.collegeType,
        type: colleges.type,
        counsellorEmail: colleges.counsellorEmail,
        counsellorPhone: colleges.counsellorPhone,
        verificationStatus: colleges.verificationStatus,
        createdAt: colleges.createdAt,
        ownerEmail: users.email,
      })
      .from(colleges)
      .innerJoin(users, eq(colleges.userId, users.id))
      .where(whereClause)
      .orderBy(desc(colleges.createdAt), asc(colleges.name))
      .limit(pageSize)
      .offset(offset),
  ])

  const collegeIds = collegeRows.map((college) => college.id)

  const [applicationRows, viewRows, documentRows] = await Promise.all([
    collegeIds.length > 0
      ? db
          .select({
            collegeId: applications.collegeId,
            applications: sql<number>`count(*)::int`,
          })
          .from(applications)
          .where(inArray(applications.collegeId, collegeIds))
          .groupBy(applications.collegeId)
      : Promise.resolve([]),
    collegeIds.length > 0
      ? db
          .select({
            collegeId: analyticsEvents.collegeId,
            views: sql<number>`count(*)::int`,
          })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.eventType, 'view_college'),
              inArray(analyticsEvents.collegeId, collegeIds)
            )
          )
          .groupBy(analyticsEvents.collegeId)
      : Promise.resolve([]),
    collegeIds.length > 0
      ? db
          .select({
            collegeId: documents.collegeId,
            id: documents.id,
            type: documents.type,
            fileName: documents.fileName,
          })
          .from(documents)
          .where(
            and(
              inArray(documents.collegeId, collegeIds),
              eq(documents.storageBucket, storageBuckets.verification)
            )
          )
      : Promise.resolve([]),
  ])

  const applicationsByCollege = new Map<string, number>()
  applicationRows.forEach((row) => {
    applicationsByCollege.set(String(row.collegeId), Number(row.applications))
  })

  const viewsByCollege = new Map<string, number>()
  viewRows.forEach((row) => {
    if (row.collegeId) {
      viewsByCollege.set(String(row.collegeId), Number(row.views))
    }
  })

  const docsByCollege = documentRows.reduce<
    Record<string, Array<{ id: string; type: string; fileName: string | null }>>
  >((accumulator, row) => {
    if (!accumulator[row.collegeId]) {
      accumulator[row.collegeId] = []
    }

    accumulator[row.collegeId].push({
      id: row.id,
      type: row.type,
      fileName: row.fileName,
    })

    return accumulator
  }, {})

  return {
    total: totalRows[0]?.total ?? 0,
    colleges: collegeRows.map((college) => ({
      ...college,
      applications: applicationsByCollege.get(college.id) ?? 0,
      views: viewsByCollege.get(college.id) ?? 0,
      documents: docsByCollege[college.id] ?? [],
    })),
  }
}

export async function getAdminStudents({
  search,
  page,
  pageSize,
}: {
  search?: string
  page: number
  pageSize: number
}) {
  const filters: SQL[] = [eq(users.role, 'student')]

  const normalizedSearch = search?.trim()
  if (normalizedSearch) {
    filters.push(
      sql`(${users.name} ILIKE ${`%${normalizedSearch}%`} OR ${users.email} ILIKE ${`%${normalizedSearch}%`})`
    )
  }

  const whereClause = and(...filters)
  const offset = (page - 1) * pageSize

  const [totalRows, studentRows] = await Promise.all([
    db.select({ total: count() }).from(users).where(whereClause),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt), asc(users.name))
      .limit(pageSize)
      .offset(offset),
  ])

  const studentIds = studentRows.map((student) => student.id)

  const [applicationRows, enquiryRows, shortlistRows] = await Promise.all([
    studentIds.length > 0
      ? db
          .select({
            studentId: applications.studentId,
            applications: sql<number>`count(*)::int`,
          })
          .from(applications)
          .where(inArray(applications.studentId, studentIds))
          .groupBy(applications.studentId)
      : Promise.resolve([]),
    studentIds.length > 0
      ? db
          .select({
            studentId: enquiries.studentId,
            enquiries: sql<number>`count(*)::int`,
          })
          .from(enquiries)
          .where(inArray(enquiries.studentId, studentIds))
          .groupBy(enquiries.studentId)
      : Promise.resolve([]),
    studentIds.length > 0
      ? db
          .select({
            studentId: shortlists.studentId,
            shortlists: sql<number>`count(*)::int`,
          })
          .from(shortlists)
          .where(inArray(shortlists.studentId, studentIds))
          .groupBy(shortlists.studentId)
      : Promise.resolve([]),
  ])

  const applicationsByStudent = new Map<string, number>()
  applicationRows.forEach((row) => {
    applicationsByStudent.set(String(row.studentId), Number(row.applications))
  })

  const enquiriesByStudent = new Map<string, number>()
  enquiryRows.forEach((row) => {
    if (row.studentId) {
      enquiriesByStudent.set(String(row.studentId), Number(row.enquiries))
    }
  })

  const shortlistsByStudent = new Map<string, number>()
  shortlistRows.forEach((row) => {
    shortlistsByStudent.set(String(row.studentId), Number(row.shortlists))
  })

  return {
    total: totalRows[0]?.total ?? 0,
    students: studentRows.map((student) => ({
      ...student,
      applications: applicationsByStudent.get(student.id) ?? 0,
      enquiries: enquiriesByStudent.get(student.id) ?? 0,
      shortlists: shortlistsByStudent.get(student.id) ?? 0,
    })),
  }
}

export async function getAdminCollegeDetails(collegeId: string) {
  const [college] = await db
    .select({
      id: colleges.id,
      userId: colleges.userId,
      name: colleges.name,
      slug: colleges.slug,
      city: colleges.city,
      state: colleges.state,
      pincode: colleges.pincode,
      type: colleges.type,
      affiliation: colleges.affiliation,
      website: colleges.website,
      description: colleges.description,
      logoUrl: colleges.logoUrl,
      naacGrade: colleges.naacGrade,
      nirfRank: colleges.nirfRank,
      counsellorEmail: colleges.counsellorEmail,
      counsellorPhone: colleges.counsellorPhone,
      verificationStatus: colleges.verificationStatus,
      createdAt: colleges.createdAt,
      ownerEmail: users.email,
    })
    .from(colleges)
    .innerJoin(users, eq(colleges.userId, users.id))
    .where(eq(colleges.id, collegeId))
    .limit(1)

  if (!college) {
    return null
  }

  const [documentRows, courseRows, applicationsRow, enquiriesRow, viewsRow] = await Promise.all([
    db
      .select({
        id: documents.id,
        type: documents.type,
        fileName: documents.fileName,
        storageBucket: documents.storageBucket,
        uploadedAt: documents.uploadedAt,
      })
      .from(documents)
      .where(
        and(
          eq(documents.collegeId, collegeId),
          eq(documents.storageBucket, storageBuckets.verification)
        )
      )
      .orderBy(desc(documents.uploadedAt)),
    db
      .select({
        id: courses.id,
        name: courses.name,
        degree: courses.degree,
        seats: courses.seats,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(eq(courses.collegeId, collegeId))
      .orderBy(asc(courses.name)),
    db
      .select({ total: count() })
      .from(applications)
      .where(eq(applications.collegeId, collegeId)),
    db
      .select({ total: count() })
      .from(enquiries)
      .where(eq(enquiries.collegeId, collegeId)),
    db
      .select({ total: count() })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.collegeId, collegeId),
          eq(analyticsEvents.eventType, 'view_college')
        )
      ),
  ])

  return {
    ...college,
    documents: documentRows,
    courses: courseRows,
    stats: {
      applications: applicationsRow[0]?.total ?? 0,
      enquiries: enquiriesRow[0]?.total ?? 0,
      views: viewsRow[0]?.total ?? 0,
    },
  }
}

export async function updateCollegeVerificationStatus({
  collegeId,
  status,
}: {
  collegeId: string
  status: 'approved' | 'rejected' | 'suspended'
}) {
  const [college] = await db
    .update(colleges)
    .set({ verificationStatus: status })
    .where(eq(colleges.id, collegeId))
    .returning({
      id: colleges.id,
      name: colleges.name,
      userId: colleges.userId,
    })

  return college ?? null
}

export async function deleteCollegeCascade(collegeId: string) {
  const [college] = await db
    .select({
      id: colleges.id,
      userId: colleges.userId,
    })
    .from(colleges)
    .where(eq(colleges.id, collegeId))
    .limit(1)

  if (!college) {
    return null
  }

  const [documentRows, storyRows, applicationRows] = await Promise.all([
    db
      .select({
        storageBucket: documents.storageBucket,
        storagePath: documents.storagePath,
      })
      .from(documents)
      .where(eq(documents.collegeId, collegeId)),
    db
      .select({
        imageBucket: successStories.imageBucket,
        imagePath: successStories.imagePath,
      })
      .from(successStories)
      .where(eq(successStories.collegeId, collegeId)),
    db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.collegeId, collegeId)),
  ])

  const applicationIds = applicationRows.map((application) => application.id)

  // Neon HTTP driver does not support interactive transactions.
  if (applicationIds.length > 0) {
    await db
      .delete(applicationStatusHistory)
      .where(inArray(applicationStatusHistory.applicationId, applicationIds))
  }

  await db.delete(shortlists).where(eq(shortlists.collegeId, collegeId))
  await db.delete(analyticsEvents).where(eq(analyticsEvents.collegeId, collegeId))
  await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, college.userId))
  await db.delete(enquiries).where(eq(enquiries.collegeId, collegeId))
  await db.delete(applications).where(eq(applications.collegeId, collegeId))
  await db.delete(courses).where(eq(courses.collegeId, collegeId))
  await db.delete(campusDrives).where(eq(campusDrives.collegeId, collegeId))
  await db.delete(successStories).where(eq(successStories.collegeId, collegeId))
  await db.delete(documents).where(eq(documents.collegeId, collegeId))
  await db.delete(colleges).where(eq(colleges.id, collegeId))
  await db.delete(users).where(eq(users.id, college.userId))

  const pathsByBucket = new Map<string, string[]>()

  documentRows.forEach((row) => {
    if (!pathsByBucket.has(row.storageBucket)) {
      pathsByBucket.set(row.storageBucket, [])
    }

    pathsByBucket.get(row.storageBucket)?.push(row.storagePath)
  })

  storyRows.forEach((row) => {
    if (!row.imageBucket || !row.imagePath) {
      return
    }

    if (!pathsByBucket.has(row.imageBucket)) {
      pathsByBucket.set(row.imageBucket, [])
    }

    pathsByBucket.get(row.imageBucket)?.push(row.imagePath)
  })

  for (const [bucket, paths] of pathsByBucket.entries()) {
    const uniquePaths = [...new Set(paths)]
    if (uniquePaths.length === 0) {
      continue
    }

    const { error } = await storageAdmin.storage.from(bucket).remove(uniquePaths)
    if (error) {
      console.error('Admin college delete storage cleanup error:', error)
    }
  }

  return college
}
