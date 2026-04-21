import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Creating GIN trigram index on colleges.name...')
  await sql`CREATE INDEX IF NOT EXISTS colleges_name_trgm_idx ON colleges USING GIN (name gin_trgm_ops)`
  console.log('✓ colleges_name_trgm_idx created')

  // Verify all tables exist
  console.log('\nVerifying tables...')
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  console.log('Tables found:')
  for (const t of tables) {
    console.log(`  ✓ ${t.table_name}`)
  }

  // Verify extensions
  console.log('\nVerifying extensions...')
  const exts = await sql`
    SELECT extname FROM pg_extension
    WHERE extname IN ('pg_trgm', 'postgis')
    ORDER BY extname
  `
  for (const e of exts) {
    console.log(`  ✓ ${e.extname}`)
  }

  console.log('\n✅ Database setup complete!')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
