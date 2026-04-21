import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { colleges } from './colleges'

export const courseLevelEnum = pgEnum('course_level', [
  'ug',
  'pg',
  'doctorate',
  'diploma',
  'certification',
])

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collegeId: uuid('college_id')
      .references(() => colleges.id)
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    degree: varchar('degree', { length: 100 }),
    duration: integer('duration'),
    courseLevel: courseLevelEnum('course_level'),
    stream: varchar('stream', { length: 100 }), // e.g., 'Computer Science', 'Mechanical'
    totalFee: numeric('total_fee', { precision: 12, scale: 2 }),
    annualFee: numeric('annual_fee', { precision: 12, scale: 2 }),
    seats: integer('seats'),
    placementPercent: numeric('placement_percent', { precision: 5, scale: 2 }),
    avgPackage: numeric('avg_package', { precision: 12, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('courses_college_id_idx').on(table.collegeId),
    index('courses_course_level_idx').on(table.courseLevel),
    index('courses_annual_fee_idx').on(table.annualFee),
    index('courses_total_fee_idx').on(table.totalFee),
    index('courses_discovery_filter_idx').on(
      table.collegeId,
      table.courseLevel,
      table.annualFee,
      table.totalFee
    ),
  ]
)
