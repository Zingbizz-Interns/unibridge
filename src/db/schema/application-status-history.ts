import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { applications, applicationStatusEnum } from './applications'
import { users } from './users'

export const applicationStatusHistory = pgTable(
  'application_status_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .references(() => applications.id)
      .notNull(),
    status: applicationStatusEnum('status').notNull(),
    note: text('note'),
    changedByUserId: uuid('changed_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('application_status_history_application_idx').on(table.applicationId),
    index('application_status_history_created_at_idx').on(table.createdAt),
  ]
)
