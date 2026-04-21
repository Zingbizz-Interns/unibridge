import { pgTable, pgEnum, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['student', 'college', 'admin'])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 15 }),
    resetToken: text('reset_token'),
    resetTokenExpiry: timestamp('reset_token_expiry'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('users_role_created_at_idx').on(table.role, table.createdAt),
  ]
)
