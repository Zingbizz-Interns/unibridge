import { pgTable, pgEnum, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { colleges } from './colleges'
import { users } from './users'

export const claimStatusEnum = pgEnum('claim_status', ['pending', 'approved', 'rejected'])

export const collegeClaims = pgTable(
  'college_claims',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collegeId: uuid('college_id')
      .notNull()
      .references(() => colleges.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: claimStatusEnum('status').default('pending').notNull(),
    adminName: varchar('admin_name', { length: 255 }).notNull(),
    adminPhone: varchar('admin_phone', { length: 15 }).notNull(),
    counsellorName: varchar('counsellor_name', { length: 255 }),
    counsellorPhone: varchar('counsellor_phone', { length: 15 }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at'),
  },
  (table) => [
    index('college_claims_college_id_idx').on(table.collegeId),
    index('college_claims_user_id_idx').on(table.userId),
    index('college_claims_status_idx').on(table.status),
  ]
)

import { relations } from 'drizzle-orm'

export const collegeClaimsRelations = relations(collegeClaims, ({ one }) => ({
  college: one(colleges, {
    fields: [collegeClaims.collegeId],
    references: [colleges.id],
  }),
  user: one(users, {
    fields: [collegeClaims.userId],
    references: [users.id],
  }),
}))
