import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { colleges } from './colleges'
import { courses } from './courses'

export const applicationStatusEnum = pgEnum('application_status', [
  'submitted',
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
])

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .references(() => users.id)
      .notNull(),
    collegeId: uuid('college_id')
      .references(() => colleges.id)
      .notNull(),
    courseId: uuid('course_id').references(() => courses.id),
    status: applicationStatusEnum('status').default('submitted'),
    dob: date('dob'),
    gender: varchar('gender', { length: 20 }),
    category: varchar('category', { length: 50 }),
    phone: varchar('phone', { length: 15 }),
    tenthPercent: numeric('tenth_percent', { precision: 5, scale: 2 }),
    twelfthPercent: numeric('twelfth_percent', { precision: 5, scale: 2 }),
    entranceExam: varchar('entrance_exam', { length: 100 }),
    entranceScore: numeric('entrance_score', { precision: 8, scale: 2 }),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }),
    notes: text('notes'),
    submittedAt: timestamp('submitted_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('applications_student_college_unique').on(
      table.studentId,
      table.collegeId
    ),
    index('applications_submitted_at_idx').on(table.submittedAt),
    index('applications_status_submitted_at_idx').on(table.status, table.submittedAt),
  ]
)
