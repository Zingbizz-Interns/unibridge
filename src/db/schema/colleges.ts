import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  geometry,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const verificationStatusEnum = pgEnum('verification_status', [
  'pending',
  'approved',
  'rejected',
  'suspended',
])

export const categoryEnum = pgEnum('college_category', [
  'engineering',
  'medical',
  'arts_science',
])

export const collegeTypeEnum = pgEnum('college_type', [
  'affiliated',
  'university',
  'autonomous',
])

export const colleges = pgTable(
  'colleges',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    name: varchar('name', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 500 }).notNull().unique(),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pincode: varchar('pincode', { length: 10 }),
    location: geometry('location', { type: 'point', srid: 4326 }),
    nirfRank: integer('nirf_rank'),
    naacGrade: varchar('naac_grade', { length: 5 }),
    category: categoryEnum('category'),
    collegeType: collegeTypeEnum('college_type'),
    type: varchar('type', { length: 50 }),
    engineeringCutoff: numeric('engineering_cutoff', { precision: 5, scale: 2 }),
    medicalCutoff: numeric('medical_cutoff', { precision: 5, scale: 2 }),
    affiliation: varchar('affiliation', { length: 255 }),
    website: text('website'),
    description: text('description'),
    logoUrl: text('logo_url'),
    verificationStatus: verificationStatusEnum('verification_status').default(
      'pending'
    ),
    counsellorName: varchar('counsellor_name', { length: 255 }),
    counsellorEmail: varchar('counsellor_email', { length: 255 }),
    counsellorPhone: varchar('counsellor_phone', { length: 15 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('colleges_verification_status_idx').on(table.verificationStatus),
    index('colleges_category_idx').on(table.category),
    index('colleges_college_type_idx').on(table.collegeType),
    index('colleges_state_city_idx').on(table.state, table.city),
    index('colleges_discovery_filter_idx').on(
      table.verificationStatus,
      table.category,
      table.collegeType,
      table.state,
      table.city,
      table.nirfRank
    ),
    index('colleges_nirf_rank_idx').on(table.nirfRank),
    index('colleges_created_at_idx').on(table.createdAt),
  ]
)
