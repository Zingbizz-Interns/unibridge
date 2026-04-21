import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { colleges } from './colleges'

export const documentTypeEnum = pgEnum('document_type', [
  'naac_certificate',
  'aicte_approval',
  'ugc_letter',
  'brochure',
  'disclosure',
  'mandatory_disclosure',
  'fee_structure',
  'accreditation',
  'other',
])

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  collegeId: uuid('college_id')
    .references(() => colleges.id)
    .notNull(),
  type: documentTypeEnum('type').notNull(),
  fileName: varchar('file_name', { length: 500 }),
  storageBucket: varchar('storage_bucket', { length: 100 }).notNull(),
  storagePath: text('storage_path').notNull(),
  publicUrl: text('public_url'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
})
