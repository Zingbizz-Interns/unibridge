import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { colleges } from './colleges'

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    userId: uuid('user_id').references(() => users.id),
    collegeId: uuid('college_id').references(() => colleges.id),
    city: varchar('city', { length: 100 }),
    course: varchar('course', { length: 255 }),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('analytics_events_event_type_created_at_idx').on(table.eventType, table.createdAt),
    index('analytics_events_college_event_type_idx').on(table.collegeId, table.eventType),
  ]
)

export const shortlists = pgTable(
  'shortlists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id')
      .references(() => users.id)
      .notNull(),
    collegeId: uuid('college_id')
      .references(() => colleges.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('shortlists_student_college_unique').on(
      table.studentId,
      table.collegeId
    ),
  ]
)
