import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from './users'
import { colleges } from './colleges'

export const enquiries = pgTable('enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id),
  collegeId: uuid('college_id')
    .references(() => colleges.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 15 }),
  message: text('message'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
})
