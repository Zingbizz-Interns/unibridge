import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  date,
  timestamp,
} from 'drizzle-orm/pg-core'
import { colleges } from './colleges'

export const campusDrives = pgTable('campus_drives', {
  id: uuid('id').defaultRandom().primaryKey(),
  collegeId: uuid('college_id')
    .references(() => colleges.id)
    .notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }),
  ctc: numeric('ctc', { precision: 12, scale: 2 }),
  driveDate: date('drive_date'),
  studentsPlaced: integer('students_placed'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const successStories = pgTable('success_stories', {
  id: uuid('id').defaultRandom().primaryKey(),
  collegeId: uuid('college_id')
    .references(() => colleges.id)
    .notNull(),
  studentName: varchar('student_name', { length: 255 }).notNull(),
  batch: varchar('batch', { length: 10 }),
  company: varchar('company', { length: 255 }),
  role: varchar('role', { length: 255 }),
  ctc: numeric('ctc', { precision: 12, scale: 2 }),
  imageBucket: varchar('image_bucket', { length: 100 }),
  imagePath: text('image_path'),
  imageUrl: text('image_url'),
  story: text('story'),
  createdAt: timestamp('created_at').defaultNow(),
})
